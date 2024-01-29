"""Define a custom manager for page extensions"""

from django.apps import apps
from django.db import models
from django.utils import translation

from cms.extensions import PageExtension
from cms.models import Title
from cms.utils import get_current_site, i18n, page_permissions


def get_plugin_language_fallback_clause(language, is_draft):
    """
    Return a language fallback clause to apply in more complex queries where we
    select plugins and need to apply language fallbacks.
    """
    site = get_current_site()
    languages = [language] + i18n.get_fallback_languages(language, site_id=site.pk)
    languages = list(dict.fromkeys(languages))

    for item in range(len(languages)):
        for previous_item, previous_language in enumerate(languages[: item + 1]):
            qop_dict = {
                "extended_object__placeholders__cmsplugin__language": previous_language
            }
            if previous_item == item:
                if not is_draft:
                    qop_dict.update(
                        {
                            "extended_object__title_set__language": previous_language,
                            "extended_object__title_set__published": True,
                        }
                    )
                qop = models.Q(**qop_dict)
            else:
                qop = ~models.Q(**qop_dict)

            if previous_item == 0:
                subclause = qop
            else:
                subclause &= qop

        if item == 0:
            language_clause = subclause
        else:
            language_clause |= subclause

    return language_clause


def get_relevant_page_with_fallbacks(context, instance):
    """
    The plugin should show the published page whenever it exists or the draft page
    otherwise but only in edit mode.

    This is inspired by what DjangoCMS does in its main view:
    https://github.com/django-cms/django-cms/blob/3.8.0/cms/views.py#L37
    """
    request = context["request"]
    site = get_current_site()

    # Check permissions
    if not page_permissions.user_can_view_page(request.user, instance.page, site):
        return None

    relevant_page = instance.page.get_public_object()

    if not relevant_page:
        if context.get("current_page") and context["current_page"].publisher_is_draft:
            return instance.page
        return None

    if request.user.is_staff:
        user_languages = i18n.get_language_list(site_id=site.pk)
    else:
        user_languages = i18n.get_public_languages(site_id=site.pk)

    # These languages are then filtered out by the user allowed languages
    available_languages = [
        language
        for language in user_languages
        if language in list(relevant_page.get_published_languages())
    ]

    request_language = translation.get_language_from_request(request, check_path=True)
    if request_language not in user_languages:
        # Language is not allowed
        # Use the default site language
        default_language = i18n.get_default_language_for_site(site.pk)
        fallbacks = i18n.get_fallback_languages(default_language, site_id=site.pk)
        fallbacks = [default_language] + fallbacks
    else:
        fallbacks = i18n.get_fallback_languages(request_language, site_id=site.pk)

    # Only fallback to languages the user is allowed to see
    fallback_languages = [
        language
        for language in fallbacks
        if language != request_language and language in available_languages
    ]

    if request_language not in available_languages:
        if not fallback_languages:
            # There is no page with the requested language
            # and there's no configured fallbacks
            return None
        if request_language in relevant_page.get_languages():
            # The page was already published and later unpublished in the current
            # language. In this case we must not fallback to another language.
            return None

    return relevant_page


class PageExtensionQuerySet(models.QuerySet):
    """
    Add custom filters to the default Django queryset for page extensions.
    """

    def drafts(self):
        """
        Custom filter to get only the draft page extension instances based on the status of the
        linked DjangoCMS page.
        """
        return self.filter(extended_object__publisher_is_draft=True)

    def published(self):
        """
        Custom filter to get only the published page extension instances based on the status of the
        linked DjangoCMS page.
        """
        return self.filter(extended_object__publisher_is_draft=False)


class PageExtensionManager(models.Manager):
    """
    Add custom filters to the default Django manager for page extensions.
    """

    def get_queryset(self):
        """
        Use our custom queryset for page extensions.
        """
        return PageExtensionQuerySet(self.model, using=self._db)

    def drafts(self):
        """
        Make our custom filter "drafts" available on the page extension manager.
        """
        return self.get_queryset().drafts()

    def published(self):
        """
        Make our custom filter "published" available on the page extension manager.
        """
        return self.get_queryset().published()


class BasePageExtension(PageExtension):
    """
    The base page extension class is used as base for all our page extension models
    """

    objects = PageExtensionManager()

    class Meta:
        abstract = True

    def check_publication(self, language=None):
        """
        Allow checking if a page extension is published without passing any language (unlike the
        "is_published" method on the page object): if not explicitly passed as argument, the
        language is retrieved from the context.

        The actual check is subcontracted to the "is_published" method on the related Django CMS
        Page object.

        Note: We choose not to name our method "is_published" like Django CMS, because it is a
        bad practice. Indeed, someone may think it is a property and use it without invocating it
        and the returned value (a bound method) will always be truthy... This issue happened a lot
        with the "is_authenticated" method on Django's User model before they converted it to a
        property.
        """
        language = language or translation.get_language()
        return self.extended_object.is_published(language)

    def get_direct_related_page_extensions(
        self, extension_model, plugin_model, language=None
    ):
        """
        Return the page extensions linked to this page via a plugin in a placeholder, ranked by
        their `path` to respect the order in the page tree.
        """
        current_language = language or translation.get_language()
        site = get_current_site()

        languages = [current_language] + i18n.get_fallback_languages(
            current_language, site_id=site.pk
        )
        existing_languages = (
            plugin_model.objects.filter(
                cmsplugin_ptr__placeholder__page=self.extended_object
            )
            .values_list("cmsplugin_ptr__language", flat=True)
            .distinct()
        )

        relevant_language = next(
            filter(lambda lang: lang in existing_languages, languages), current_language
        )

        related_name = plugin_model.page.field.related_query_name()
        selector = f"extended_object__{related_name:s}__cmsplugin_ptr"
        # pylint: disable=no-member
        filter_dict = {
            f"{selector:s}__language": relevant_language,
            f"{selector:s}__placeholder__page": self.extended_object,
        }
        # For a public course, we must filter out page extensions that are not published
        # in any language
        if self.extended_object.publisher_is_draft is False:
            filter_dict["extended_object__title_set__published"] = True

        return (
            extension_model.objects.filter(**filter_dict)
            .select_related("extended_object")
            .order_by("extended_object__node__path")
            .distinct()
        )

    # pylint: disable=too-many-locals
    def get_reverse_related_page_extensions(
        self, model_name, language=None, include_descendants=False
    ):
        """
        Return a query to get the page extensions of a given model type related to the current
        page extension instance.

        For example: for an organization, it will return all courses that are pointing to this
        organization via an OrganizationPlugin in any placeholder of the course page.
        """
        is_draft = self.extended_object.publisher_is_draft
        # pylint: disable=no-member
        page_extension = self if is_draft else self.draft_extension
        page = page_extension.extended_object
        current_language = language or translation.get_language()
        language_clause = get_plugin_language_fallback_clause(
            current_language, is_draft
        )

        self_name = self._meta.model.__name__.lower()
        if include_descendants is True:
            bfs = (
                "extended_object__placeholders__cmsplugin__"
                f"courses_{self_name:s}pluginmodel__page__node"
            )
            selector = {
                f"{bfs:s}__path__startswith": page.node.path,
                f"{bfs:s}__depth__gte": page.node.depth,
            }
        else:
            bfs = (
                "extended_object__placeholders__cmsplugin__courses_"
                f"{self_name:s}pluginmodel__page"
            )
            selector = {bfs: page}

        # For a public page, we must filter out page extensions that are not published
        # in any language
        if is_draft is False:
            selector["extended_object__title_set__published"] = True

        page_extension_model = apps.get_model(
            app_label="courses", model_name=model_name
        )
        # pylint: disable=no-member
        return (
            page_extension_model.objects.filter(
                language_clause,
                extended_object__publisher_is_draft=is_draft,
                **selector,
            )
            .select_related("extended_object")
            .prefetch_related(
                models.Prefetch(
                    "extended_object__title_set",
                    to_attr="prefetched_titles",
                    queryset=Title.objects.filter(language=current_language),
                )
            )
            .distinct()
            .order_by("extended_object__node__path")
        )


class EsIdMixin:
    """
    Add a common method to get the ES ID for an indexed object to all the models
    that are indexed in ES.
    """

    def get_es_id(self):
        """
        Get the ElasticSearch ID for this object. It should be the same for both the published
        and draft versions of the object.
        """
        try:
            if self.public_extension:
                return str(self.public_extension.extended_object_id)
            if self.draft_extension:
                return str(self.extended_object_id)
        # pylint: disable=broad-except
        except AttributeError:
            pass
        return None

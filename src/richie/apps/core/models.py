"""Define a custom manager for page extensions"""
from django.db import models
from django.utils import translation

from cms.extensions import PageExtension
from cms.utils import get_current_site, i18n, page_permissions


def get_public_page_with_fallbacks(page, request):
    """
    the plugin should show the published page whenever it exists or the draft page otherwise.

    On a public content, the draft page should not be shown at all but this is left to the
    caller.

    This is inspired by what DjangoCMS does in its main view:
    https://github.com/django-cms/django-cms/blob/3.8.0/cms/views.py#L37
    """
    page = page.get_public_object()
    request_language = translation.get_language_from_request(request, check_path=True)

    if not page:
        return None

    # Check permissions
    site = get_current_site()
    if not page_permissions.user_can_view_page(request.user, page, site):
        return None

    if request.user.is_staff:
        user_languages = i18n.get_language_list(site_id=site.pk)
    else:
        user_languages = i18n.get_public_languages(site_id=site.pk)

    # These languages are then filtered out by the user allowed languages
    available_languages = [
        language
        for language in user_languages
        if language in list(page.get_published_languages())
    ]

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
        if request_language in page.get_languages():
            # The page was already published and later unpublished in the current
            # language. In this case we must not fallback to another language.
            return None

    return page


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
    The organization page extension represents and records entities that manage courses.
    It could be a university or a training company for example.

    This model should be used to record structured data about the organization whereas the
    associated page object is where we record the less structured information to display on the
    page to present the organization.
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

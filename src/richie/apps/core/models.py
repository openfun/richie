"""Define a custom manager for page extensions"""
from django.db import models
from django.utils import translation

from cms.extensions import PageExtension


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


class PagePluginMixin:
    """
    A base plugin model to build all our plugins that are used to publish a glimpse of a page on
    another page.
    """

    @property
    def relevant_page(self):
        """
        the plugin should show the published page whenever it exists or the draft page otherwise.

        On a public content, the draft page should not be shown at all but this is left to the
        caller.
        """
        if self.page.is_published(translation.get_language()):
            return self.page.get_public_object()
        return self.page

    def check_publication(self, language=None):
        """
        Allow checking if the page is published without passing any language (unlike the
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
        return self.page.is_published(language)

    def __str__(self):
        """Human representation of a page plugin"""
        return self.page.get_title()

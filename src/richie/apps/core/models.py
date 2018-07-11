"""Define a custom manager for page extensions"""
from django.db import models

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

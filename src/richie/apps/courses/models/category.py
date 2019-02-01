"""
Declare and configure the models for the courses application
"""
from django.apps import apps
from django.db import models
from django.db.models import Prefetch
from django.utils import translation
from django.utils.translation import ugettext_lazy as _

from cms.api import Page
from cms.extensions.extension_pool import extension_pool
from cms.models import Title
from cms.models.pluginmodel import CMSPlugin

from ...core.models import BasePageExtension, PagePluginMixin


class Category(BasePageExtension):
    """
    The category page extension represents and records a thematic in the catalog.

    This model should be used to record structured data about the thematic whereas the
    associated page object is where we record the less structured information to display on the
    page that presents the thematic.
    """

    ROOT_REVERSE_ID = "categories"
    TEMPLATE_DETAIL = "courses/cms/category_detail.html"

    class Meta:
        verbose_name = _("category")
        ordering = ["-pk"]

    def __str__(self):
        """Human representation of a category"""
        return "{model}: {title}".format(
            model=self._meta.verbose_name.title(),
            title=self.extended_object.get_title(),
        )

    def get_courses(self, language=None):
        """
        Return a query to get the courses related to this category ie for which a plugin for
        this category is linked to the course page on the "course_categories" placeholder.
        """
        page = (
            self.extended_object
            if self.extended_object.publisher_is_draft
            else self.draft_extension.extended_object
        )
        language = language or translation.get_language()
        bfs = "extended_object__placeholders__cmsplugin__courses_categorypluginmodel__page"
        filter_dict = {
            "extended_object__node__parent__cms_pages__course__isnull": True,
            "extended_object__publisher_is_draft": True,
            "extended_object__placeholders__slot": "course_categories",
            "extended_object__placeholders__cmsplugin__language": language,
            bfs: page,
            "{:s}__publisher_is_draft".format(bfs): True,
        }
        course_model = apps.get_model(app_label="courses", model_name="course")
        # pylint: disable=no-member
        return (
            course_model.objects.filter(**filter_dict)
            .select_related("extended_object")
            .prefetch_related(
                Prefetch(
                    "extended_object__title_set",
                    to_attr="prefetched_titles",
                    queryset=Title.objects.filter(language=language),
                )
            )
            .distinct()
        )


class CategoryPluginModel(PagePluginMixin, CMSPlugin):
    """
    Category plugin model handles the relation between CategoryPlugin
    and their Category instance
    """

    page = models.ForeignKey(
        Page,
        related_name="category_plugins",
        limit_choices_to={"publisher_is_draft": True, "category__isnull": False},
    )

    class Meta:
        verbose_name = _("category plugin model")

    def __str__(self):
        """Human representation of a page plugin"""
        return "{model:s}: {id:d}".format(
            model=self._meta.verbose_name.title(), id=self.id
        )


extension_pool.register(Category)

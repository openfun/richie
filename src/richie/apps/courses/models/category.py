"""
Declare and configure the models for the courses application
"""
from django.apps import apps
from django.conf import settings
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
        db_table = "richie_category"
        ordering = ["-pk"]
        verbose_name = _("category")

    def __str__(self):
        """Human representation of a category"""
        ancestors = self.extended_object.get_ancestor_pages().filter(
            category__isnull=False
        )
        return "{ancestors:s}{title:s}".format(
            ancestors="{:s} / ".format(" / ".join([a.get_title() for a in ancestors]))
            if ancestors
            else "",
            title=self.extended_object.get_title(),
        )

    def get_courses(self, language=None):
        """
        Return a query to get the courses related to this category ie for which a plugin for
        this category is linked to the course page on the "course_categories" placeholder.
        """
        is_draft = self.extended_object.publisher_is_draft
        category = self if is_draft else self.draft_extension
        language = language or translation.get_language()

        bfs = "extended_object__placeholders__cmsplugin__courses_categorypluginmodel__page"
        filter_dict = {
            "extended_object__node__parent__cms_pages__course__isnull": True,
            "extended_object__publisher_is_draft": is_draft,
            "extended_object__placeholders__slot": "course_categories",
            "extended_object__placeholders__cmsplugin__language": language,
            bfs: category.extended_object,
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

    def get_blogposts(self, language=None):
        """
        Return a query to get the blogposts related to this category ie for which a
        plugin for this category is linked to the blogpost page on the "categories"
        placeholder.
        """
        is_draft = self.extended_object.publisher_is_draft
        category = self if is_draft else self.draft_extension
        language = language or translation.get_language()

        bfs = "extended_object__placeholders__cmsplugin__courses_categorypluginmodel__page"
        filter_dict = {
            "extended_object__publisher_is_draft": is_draft,
            "extended_object__placeholders__slot": "categories",
            "extended_object__placeholders__cmsplugin__language": language,
            bfs: category.extended_object,
        }

        blogpost_model = apps.get_model(app_label="courses", model_name="blogpost")
        # pylint: disable=no-member
        return (
            blogpost_model.objects.filter(**filter_dict)
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

    def get_persons(self, language=None):
        """
        Return a query to get the persons related to this category ie for which a plugin for
        this category is linked to the person page on the "categories" placeholder.
        """
        is_draft = self.extended_object.publisher_is_draft
        category = self if is_draft else self.draft_extension
        language = language or translation.get_language()

        bfs = "extended_object__placeholders__cmsplugin__courses_categorypluginmodel__page"
        filter_dict = {
            "extended_object__publisher_is_draft": is_draft,
            "extended_object__placeholders__slot": "categories",
            "extended_object__placeholders__cmsplugin__language": language,
            bfs: category.extended_object,
        }

        person_model = apps.get_model(app_label="courses", model_name="person")
        # pylint: disable=no-member
        return (
            person_model.objects.filter(**filter_dict)
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

    def get_children_categories(self):
        """
        Return a query to get only the children pages that are Category
        objects related to this category. A convenient method since
        ``page.get_child_pages`` return every direct child page, no matter
        it's a Category or not.
        """
        return Category.objects.filter(
            extended_object__in=self.extended_object.get_child_pages()
        ).select_related("extended_object")


def get_category_limit_choices_to():
    """Return a query limiting the categories proposed when creating a CategoryPlugin."""
    limit_choices_to = {
        # Joining on `cms_pages` generate duplicates for categories that are under a parent page
        # when this page exists both in draft and public versions. We need to exclude the
        # parent public page to avoid this duplication with the first condition.
        # The second condition makes sure the parent is a category.
        # The third condition filters out public category.
        # The fourth condition makes sure only categories show up.
        "node__parent__cms_pages__publisher_is_draft": True,  # exclude category published parent
        "node__parent__cms_pages__category__isnull": False,  # exclude meta categories
        "publisher_is_draft": True,  # plugins work with draft instances
        "category__isnull": False,  # limit to pages linked to a category object
    }
    # Limit to leaf categories only if active in settings (False by default)
    if getattr(settings, "LIMIT_PLUGIN_CATEGORIES_TO_LEAF", False):
        limit_choices_to["node__numchild"] = 0

    return limit_choices_to


class CategoryPluginModel(PagePluginMixin, CMSPlugin):
    """
    Category plugin model handles the relation between CategoryPlugin
    and their Category instance

    We only propose to link category objects:
    - are not at the root of the category tree (this position defines a meta category which
      is used to define a filter bank on the search page e.g. Subjects, Levels).
    - that are a leaf in the category tree (can be deactivated with setting
      `LIMIT_PLUGIN_CATEGORIES_TO_LEAF`),
    """

    page = models.ForeignKey(
        Page,
        related_name="category_plugins",
        limit_choices_to=get_category_limit_choices_to,
        on_delete=models.CASCADE,
    )

    class Meta:
        db_table = "richie_category_plugin"
        verbose_name = _("category plugin")

    def __str__(self):
        """Human representation of a page plugin"""
        return "{model:s}: {id:d}".format(
            model=self._meta.verbose_name.title(), id=self.id
        )


extension_pool.register(Category)

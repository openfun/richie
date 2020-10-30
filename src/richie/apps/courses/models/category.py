"""
Declare and configure the models for the courses application
"""
from django.apps import apps
from django.conf import settings
from django.db import models
from django.db.models import Prefetch
from django.utils import translation
from django.utils.translation import gettext_lazy as _

from cms.api import Page
from cms.extensions.extension_pool import extension_pool
from cms.models import Title
from cms.models.pluginmodel import CMSPlugin

from ...core.models import BasePageExtension, PagePluginMixin
from ..defaults import CATEGORIES_PAGE, CATEGORY_GLIMPSE_VARIANT_CHOICES


class Category(BasePageExtension):
    """
    The category page extension represents and records a thematic in the catalog.

    This model should be used to record structured data about the thematic whereas the
    associated page object is where we record the less structured information to display on the
    page that presents the thematic.
    """

    color = models.CharField(max_length=10, blank=True, null=True)

    PAGE = CATEGORIES_PAGE

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

    def get_es_id(self):
        """
        An ID built with the node path and the position of this category in the taxonomy:
            - P: parent, the category has children
            - L: leaf, the category has no children

        For example: a parent category `P_00010002` and its child `L_000100020001`.
        """
        page = self.extended_object
        return f"{'L' if page.node.is_leaf() else 'P':s}-{page.node.path:s}"

    def get_meta_category(self):
        """
        Get the meta category the current category falls under. Meta-categories are a special kind
        of categories that are not linked to courses but help us organize categories into
        different kinds that are handled separately.
        """
        # Shorcut to the category's page node
        node = self.extended_object.node

        self_is_draft = self.extended_object.publisher_is_draft
        return Category.objects.get(
            extended_object__publisher_is_draft=self_is_draft,
            extended_object__node__path__in=[
                node.path[0:pos] for pos in range(0, len(node.path), node.steplen)[1:]
            ],
            extended_object__node__parent__cms_pages__category__isnull=True,
            # Avoid duplicates from the join on cms_pages
            extended_object__node__parent__cms_pages__publisher_is_draft=self_is_draft,
        )

    def get_page_extensions(self, model_name, language=None, include_descendants=True):
        """
        Return a query to get the page extentions of a given model type related to this category
        ie for which a plugin for this category is linked to the organization page via any
        placeholder.
        """
        is_draft = self.extended_object.publisher_is_draft
        category = self if is_draft else self.draft_extension
        language = language or translation.get_language()

        if include_descendants is True:
            bfs = (
                "extended_object__placeholders__cmsplugin__"
                "courses_categorypluginmodel__page__node"
            )
            selector = {
                f"{bfs:s}__path__startswith": category.extended_object.node.path,
                f"{bfs:s}__depth__gte": category.extended_object.node.depth,
            }
        else:
            bfs = "extended_object__placeholders__cmsplugin__courses_categorypluginmodel__page"
            selector = {bfs: category.extended_object}

        page_extension_model = apps.get_model(
            app_label="courses", model_name=model_name
        )
        # pylint: disable=no-member
        return (
            page_extension_model.objects.filter(
                extended_object__publisher_is_draft=is_draft,
                extended_object__placeholders__cmsplugin__language=language,
                **selector,
            )
            .select_related("extended_object")
            .prefetch_related(
                Prefetch(
                    "extended_object__title_set",
                    to_attr="prefetched_titles",
                    queryset=Title.objects.filter(language=language),
                )
            )
            .distinct()
            .order_by("extended_object__node__path")
        )

    def get_courses(self, language=None, include_descendants=True):
        """
        Return a query to get the courses related to this category ie for which a plugin for
        this category is linked to the course page via any placeholder.
        """
        return self.get_page_extensions(
            "course", language=language, include_descendants=include_descendants
        ).filter(extended_object__node__parent__cms_pages__course__isnull=True)

    def get_blogposts(self, language=None, include_descendants=True):
        """
        Return a query to get the blogposts related to this category ie for which a
        plugin for this category is linked to the blogpost page via any placeholder.
        """
        return self.get_page_extensions(
            "blogpost", language=language, include_descendants=include_descendants
        )

    def get_organizations(self, language=None, include_descendants=True):
        """
        Return a query to get the organizations related to this category ie for which a plugin
        for this category is linked to the organization page via any placeholder.
        """
        return self.get_page_extensions(
            "organization", language=language, include_descendants=include_descendants
        )

    def get_persons(self, language=None, include_descendants=True):
        """
        Return a query to get the persons related to this category ie for which a plugin for
        this category is linked to the person page via any placeholder.
        """
        return self.get_page_extensions(
            "person", language=language, include_descendants=include_descendants
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
    variant = models.CharField(
        _("variant"),
        max_length=50,
        choices=CATEGORY_GLIMPSE_VARIANT_CHOICES,
        help_text=_("Optional glimpse variant for a custom look."),
        blank=True,
        null=True,
    )

    class Meta:
        db_table = "richie_category_plugin"
        verbose_name = _("category plugin")


extension_pool.register(Category)

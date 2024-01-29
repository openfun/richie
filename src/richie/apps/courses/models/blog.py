"""
Declare and configure the models for the blog part
"""

from django.db import models
from django.utils import translation
from django.utils.translation import gettext_lazy as _

from cms.api import Page
from cms.extensions.extension_pool import extension_pool
from cms.models.pluginmodel import CMSPlugin

from ...core.models import BasePageExtension, get_plugin_language_fallback_clause
from .. import defaults
from .category import Category, CategoryPluginModel


class BlogPost(BasePageExtension):
    """
    The blogpost extension represents and records a blog article.
    """

    PAGE = defaults.BLOGPOSTS_PAGE

    class Meta:
        db_table = "richie_blog_post"
        ordering = ["-pk"]
        verbose_name = _("blog post")
        verbose_name_plural = _("blog posts")

    def __str__(self):
        """Human representation of a blogpost"""
        model = self._meta.verbose_name.title()
        name = self.extended_object.get_title()
        return f"{model:s}: {name:s}"

    def get_categories(self, language=None):
        """
        Return the categories linked to the blog post via a category plugin in any of the
        placeholders on the blog post detail page, ranked by their `path` to respect the
        order in the categories tree.
        """
        return self.get_direct_related_page_extensions(
            Category, CategoryPluginModel, language=language
        )

    def get_related_blogposts(self, language=None):
        """
        Return the blogposts related to the current blogpost ie that share common categories.
        the blogposts returned are sorted by their `path` to respect the order in the page
        tree.
        """
        is_draft = self.extended_object.publisher_is_draft
        current_language = language or translation.get_language()
        language_clause = get_plugin_language_fallback_clause(
            current_language, is_draft
        )

        bfs = (
            "extended_object__placeholders__cmsplugin__courses_categorypluginmodel"
            "__page__category__in"
        )
        selector = {bfs: self.get_categories()}

        # pylint: disable=no-member
        return (
            BlogPost.objects.filter(
                language_clause,
                extended_object__publisher_is_draft=is_draft,
                **selector,
            )
            .exclude(id=self.id)
            .select_related("extended_object")
            .distinct()
            .order_by("-extended_object__publication_date")
        )


class BlogPostPluginModel(CMSPlugin):
    """
    BlogPost plugin model handles the relation between the BlogPostPluginModel
    and its blogpost instance
    """

    page = models.ForeignKey(
        Page,
        on_delete=models.CASCADE,
        related_name="blogpost_plugins",
        limit_choices_to={"publisher_is_draft": True, "blogpost__isnull": False},
    )
    variant = models.CharField(
        _("variant"),
        max_length=50,
        choices=defaults.BLOGPOST_GLIMPSE_VARIANT_CHOICES,
        help_text=_("Optional glimpse variant for a custom look."),
        blank=True,
        null=True,
    )

    class Meta:
        db_table = "richie_blog_post_plugin"
        verbose_name = _("blog post plugin")
        verbose_name_plural = _("blog post plugins")

    def __str__(self):
        """Human representation of a page plugin"""
        return self.page.get_title()


extension_pool.register(BlogPost)

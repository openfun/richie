"""
Declare and configure the models for the blog part
"""
from django.db import models
from django.utils import translation
from django.utils.translation import gettext_lazy as _

from cms.api import Page
from cms.extensions.extension_pool import extension_pool
from cms.models.pluginmodel import CMSPlugin

from ...core.models import BasePageExtension, PagePluginMixin
from .. import defaults


class BlogPost(BasePageExtension):
    """
    The blogpost extension represents and records a blog article.
    """

    PAGE = defaults.BLOGPOSTS_PAGE

    class Meta:
        db_table = "richie_blog_post"
        ordering = ["-pk"]
        verbose_name = _("blog post")

    def __str__(self):
        """Human representation of a blogpost"""
        return "{model}: {name}".format(
            name=self.extended_object.get_title(), model=self._meta.verbose_name.title()
        )

    def _get_category_pages(self, language=None):
        """
        Return the category pages linked to the blogpost via a category plugin in the "categories"
        placeholder on the blogpost detail page, ranked by their `path` to respect the
        order in the categories tree.
        """
        language = language or translation.get_language()

        selector = "category_plugins__cmsplugin_ptr"
        # pylint: disable=no-member
        filter_dict = {
            f"{selector:s}__language": language,
            f"{selector:s}__placeholder__page": self.extended_object,
        }
        # For a public blogpost, we must filter out categories that are not published in
        # any language
        if self.extended_object.publisher_is_draft is False:
            filter_dict["title_set__published"] = True

        return Page.objects.filter(**filter_dict).order_by("node__path").distinct()

    def get_related_blogposts(self, language=None):
        """
        Return the blogposts related to the current blogpost ie that share common categories.
        the blogposts returned are sorted by their `path` to respect the order in the page
        tree.
        """
        is_draft = self.extended_object.publisher_is_draft
        language = language or translation.get_language()

        bfs = "extended_object__placeholders__cmsplugin__courses_categorypluginmodel__page__in"
        selector = {bfs: self._get_category_pages()}

        # pylint: disable=no-member
        return (
            BlogPost.objects.filter(
                extended_object__publisher_is_draft=is_draft,
                extended_object__placeholders__cmsplugin__language=language,
                **selector,
            )
            .exclude(id=self.id)
            .select_related("extended_object")
            .distinct()
            .order_by("extended_object__node__path")
        )


class BlogPostPluginModel(PagePluginMixin, CMSPlugin):
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


extension_pool.register(BlogPost)

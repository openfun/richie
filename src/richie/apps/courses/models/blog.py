"""
Declare and configure the models for the blog part
"""
from django.db import models
from django.utils.translation import ugettext_lazy as _

from cms.api import Page
from cms.extensions.extension_pool import extension_pool
from cms.models.pluginmodel import CMSPlugin

from ...core.models import BasePageExtension, PagePluginMixin


class BlogPost(BasePageExtension):
    """
    The blogpost extension represents and records a blog article.
    """

    ROOT_REVERSE_ID = "news"
    TEMPLATE_DETAIL = "courses/cms/blogpost_detail.html"

    class Meta:
        db_table = "richie_blog_post"
        ordering = ["-pk"]
        verbose_name = _("blog post")

    def __str__(self):
        """Human representation of a blogpost"""
        return "{model}: {name}".format(
            name=self.extended_object.get_title(), model=self._meta.verbose_name.title()
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

    class Meta:
        db_table = "richie_blog_post_plugin"
        verbose_name = _("blog post plugin")

    def __str__(self):
        """Human representation of a blogpost plugin"""
        return "{model:s}: {id:d}".format(
            model=self._meta.verbose_name.title(), id=self.id
        )


extension_pool.register(BlogPost)

"""HTML sitemap plugin models."""
from django.db import models
from django.utils.text import Truncator
from django.utils.translation import gettext_lazy as _

from cms.api import Page
from cms.models.pluginmodel import CMSPlugin


class HTMLSitemapPage(CMSPlugin):
    """
    HTML Sitemap page plugin model to define a specific subtree to be included in the sitemap
    and configure which pages should be excluded or not:
        - pages requiring login,
        - maximum nesting depth,
        - include or not pages that are excluded from navigation,
        - include the root page and its descendants or just its descendants.
    """

    root_page = models.ForeignKey(
        to=Page,
        limit_choices_to={"publisher_is_draft": True},
        related_name="sitemaps",
        on_delete=models.PROTECT,
        verbose_name=_("root page"),
        help_text=_(
            "This page will be at the root of your sitemap (or its children if the "
            '"include root page" flag is unticked).'
        ),
        blank=True,
        null=True,
    )
    max_depth = models.PositiveIntegerField(
        verbose_name=_("max depth"),
        help_text=_(
            "Limit the level of nesting that your sitemap will contain below this page. "
            "An empty field or 0 equals to no limit."
        ),
        blank=True,
        null=True,
    )
    in_navigation = models.BooleanField(
        default=False,
        verbose_name=_("in navigation"),
        help_text=_(
            "Tick to exclude from sitemap the pages that are excluded from navigation."
        ),
    )
    include_root_page = models.BooleanField(
        default=True,
        verbose_name=_("include root page"),
        help_text=_(
            "Tick to include the root page and its descendants. "
            "Untick to include only its descendants."
        ),
    )

    class Meta:
        verbose_name = _("HTML Sitemap")
        verbose_name_plural = _("HTML Sitemaps")

    def __str__(self):
        return (
            Truncator(self.root_page.get_title()).words(6, truncate="...")
            if self.root_page
            else str(_("Sitemap"))
        )

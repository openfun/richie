"""HTML Sitemap plugin for DjangoCMS."""

from functools import reduce

from django.contrib.sites.models import Site
from django.db.models import F, Q
from django.utils import translation
from django.utils.translation import gettext_lazy as _

from cms.constants import PUBLISHER_STATE_PENDING
from cms.models.pagemodel import Page
from cms.models.pluginmodel import CMSPlugin
from cms.plugin_base import CMSPluginBase
from cms.plugin_pool import plugin_pool

from .models import HTMLSitemapPage


def annotate_pages(pages):
    """A generator to annotate pages with nesting information.

    This is required to build a nested list of pages from the flat mptree list of pages.

    Returns:
        tuple(page, nb_open, nb_close, is_leaf):
            - page: the current page to wrap in a <li> tag,
            - nb_open(int): number of opening <ul> tags. Should be 1 when the nesting level
                increases, 0 otherwise,
            - nb_close(int): number of closing </ul> tags. Should be the gap between one page
                and the next when less nested. When reaching the last page we should close all
                the tags still open.
            - is_leaf(boolean): True if the current <li> tag is a leaf, False otherwise. If
                the page is not empty, it has children and we should delay closing the <li>.
    """
    nb_open = nb_close = 0
    nb_pages = len(pages)

    for i in range(nb_pages):
        if i == 0:
            nb_open = 0
        else:
            nb_open = max(pages[i].level - pages[i - 1].level, 0)

        is_leaf = True
        if i == nb_pages - 1:
            nb_close = pages[i].level - 1
        else:
            gap = pages[i].level - pages[i + 1].level
            nb_close = max(gap, 0)
            is_leaf = gap >= 0

        yield pages[i], nb_open, nb_close, is_leaf


@plugin_pool.register_plugin
class HTMLSitemapPlugin(CMSPluginBase):
    """HTML sitemap parent plugin acting as a container for sitemap pages."""

    model = CMSPlugin
    name = _("HTML Sitemap")
    render_template = "richie/html_sitemap/html_sitemap.html"
    allow_children = True
    child_classes = ["HTMLSitemapPagePlugin"]
    cache = False

    @classmethod
    def get_empty_change_form_text(cls, obj=None):
        """
        Customize the message on the empty change form to explain that children plugins must
        be added.
        """
        return _(
            "Press save to create a site map. You will then be able to add a child plugin for "
            "each subtree in your sitemap."
        )


@plugin_pool.register_plugin
class HTMLSitemapPagePlugin(CMSPluginBase):
    """HTML sitemap pages to add a subtree to a parent sitemap plugin."""

    model = HTMLSitemapPage
    name = _("HTML sitemap page")
    render_template = "richie/html_sitemap/html_sitemap_item.html"
    require_parent = True
    parent_classes = ["HTMLSitemapPlugin"]
    cache = True

    def render(self, context, instance, placeholder):
        """
        Prepare the list of pages to display in the sitemap and add it to the context.

        The list of pages if annotated with information about nesting so we are able
        to construct the <ul> <li> structure in the template.
        """
        language = translation.get_language()

        # It is possible to have a view without `current_page` in its context
        # In this case, we consider this page as public. i.e : error views.
        current_page_is_draft = (
            context["current_page"].publisher_is_draft
            if context.get("current_page")
            else False
        )

        if instance.root_page:
            if current_page_is_draft:
                root_page = instance.root_page
            else:
                root_page = instance.root_page.get_public_object()

            # Get all descendants of the root page including the root page itself
            node = root_page.node
            pages = Page.objects.filter(node__in=node.__class__.get_tree(node))
            depth = node.depth if instance.include_root_page else node.depth + 1

            if not instance.include_root_page:
                pages = pages.exclude(id=root_page.id)

        else:
            # Get all pages of the current site from its root
            pages = Page.objects.filter(node__site=Site.objects.get_current())
            depth = 1

        if instance.max_depth:
            pages = pages.filter(node__depth__lte=depth + instance.max_depth - 1)

        pages = (
            pages.filter(publisher_is_draft=current_page_is_draft, is_page_type=False)
            .select_related("node")
            .order_by("node__path")
        )

        exclusion_queries = []

        # For anonymous users, exclude pages that require login and their descendants
        if not context["request"].user.is_authenticated:
            exclusion_queries.append(Q(login_required=True))

        # If requested, exclude pages that are excluded from navigation, and their descendants
        if instance.in_navigation:
            exclusion_queries.append(
                Q(in_navigation=False) | Q(in_navigation__isnull=True)
            )

        # On a public page, we should display the public version only if it is
        # published in the current language
        if not current_page_is_draft:
            exclusion_queries.append(
                Q(title_set__language=language, title_set__published=False)
                | Q(
                    title_set__language=language,
                    title_set__publisher_state=PUBLISHER_STATE_PENDING,
                )
            )

        # We use a regex query on the path to exclude all the descendants of the pages we
        # identified as pages to exclude from the sitemap
        if exclusion_queries:
            paths_to_exclude = pages.filter(
                reduce(lambda q1, q2: q1 | q2, exclusion_queries, Q())
            ).values_list("node__path", flat=True)

            if paths_to_exclude:
                or_string = "|".join(paths_to_exclude)
                exclusion_regex = rf"^({or_string:s}).*"
                pages = pages.exclude(node__path__regex=exclusion_regex)

        # Annotate pages with "level" ie their depth relative to the root page
        pages = pages.annotate(level=F("node__depth") - depth + 1)

        context["annotated_pages"] = annotate_pages(pages)
        return context

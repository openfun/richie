"""Helpers for the demo app of the Richie project."""
from django.core.exceptions import ImproperlyConfigured

from richie.apps.core.helpers import create_i18n_page
from richie.apps.courses.factories import CategoryFactory


def recursive_page_creation(site, pages_info, parent=None):
    """
    Recursively create page following tree structure with parent/children.

    Arguments:
        site (django.contrib.sites.models.Site): Site object which page will
            be linked to.
        pages (dict): Page items to create recursively such as 'children' key
            value can be a dict to create child pages. The current page is
            given to children for parent relation.

    Keyword Arguments:
        parent (cms.models.pagemodel.Page): Page used as a parent to create
            page item from `pages` argument.

    Returns:
        dict: mapping of the page names passed in argument and the created page instances.
    """
    pages = {}

    for name, info in pages_info.items():
        page = create_i18n_page(
            info["title"],
            is_homepage=(name == "home"),
            in_navigation=info.get("in_navigation", True),
            published=True,
            site=site,
            parent=parent,
            **info["kwargs"],
        )

        pages[name] = page

        # Create children
        if info.get("children", None):
            children_pages = recursive_page_creation(
                site, info["children"], parent=page
            )
            for child_name in children_pages:
                if child_name in pages:
                    raise ImproperlyConfigured(
                        "Page names should be unique: {:s}".format(child_name)
                    )
            pages.update(children_pages)

    return pages


# pylint: disable=too-many-arguments
def create_categories(
    info,
    parent,
    reverse_id=None,
    should_publish=True,
    fill_banner=True,
    fill_description=True,
    fill_logo=True,
):
    """
    Create the category tree from the SUBJECTS dictionary.


    Arguments:
        info (List): definition of the category tree to create in the following format:

            {
                "title": "Subject",
                "children": [
                    {
                        "title": "Computer science",
                        "children": [
                            {"title": "Coding"},
                            {"title": "Security"},
                        ],
                    },
                    {"title": "Languages"},
                ],
            }

        page (cms.models.pagemodel.Page): Instance of a Page below which the category
            tree is created.

    Returns:
        generator[courses.models.Category]: yield only the leaf categories of the created tree.

    """
    category = CategoryFactory(
        page_title=info["title"],
        page_reverse_id=reverse_id,
        page_in_navigation=info.get("in_navigation", True),
        page_parent=parent,
        should_publish=should_publish,
        fill_banner=fill_banner,
        fill_description=fill_description,
        fill_logo=fill_logo,
    )

    if info.get("children", None):
        for child_info in info["children"]:
            yield from create_categories(
                child_info,
                category.extended_object,
                should_publish=should_publish,
                fill_banner=fill_banner,
                fill_description=fill_description,
                fill_logo=fill_logo,
            )
    else:
        # we only return leaf categories (no children)
        yield category

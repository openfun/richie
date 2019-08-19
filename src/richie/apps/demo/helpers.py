"""Helpers for the demo app of the Richie project."""
from richie.apps.courses.factories import CategoryFactory


# pylint: disable=too-many-arguments
def create_categories(
    children=None,
    color=None,
    fill_banner=True,
    fill_description=True,
    fill_icon=False,
    fill_logo=True,
    page_in_navigation=True,
    page_title=None,
    page_parent=None,
    page_reverse_id=None,
    should_publish=True,
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
        color=color,
        fill_banner=fill_banner,
        fill_description=fill_description,
        fill_icon=fill_icon,
        fill_logo=fill_logo,
        page_title=page_title,
        page_reverse_id=page_reverse_id,
        page_in_navigation=page_in_navigation,
        page_parent=page_parent,
        should_publish=should_publish,
    )

    if children:
        for child_info in children:
            kwargs = {
                "fill_banner": fill_banner,
                "fill_description": fill_description,
                "fill_icon": fill_icon,
                "fill_logo": fill_logo,
                "page_parent": category.extended_object,
                "should_publish": should_publish,
            }
            kwargs.update(child_info)
            yield from create_categories(**kwargs)
    else:
        # we only return leaf categories (no children)
        yield category

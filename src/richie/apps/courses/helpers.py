"""
Helpers that can be useful throughout Richie's courses app
"""
import time

from django.core.exceptions import PermissionDenied
from django.utils.translation import ugettext_lazy as _

from cms.api import create_title
from cms.utils import page_permissions

from .factories import CategoryFactory
from .models import Course


def snapshot_course(page, user, simulate_only=False):
    """
    Snapshotting a course is making a copy of the course page with all its permissions and
    extensions, and placing the copy as the first child of the page being snapshotted, then
    moving all the course run of the page being snapshotted as children of the new snapshot
    so we keep record of the course as it was when these course runs were played.
    """
    assert page.publisher_is_draft is True

    # If the page has a parent that is a course page, it is a snapshot and should therefore
    # not be allowed to be itself snapshotted.
    if page.parent_page:
        try:
            page.parent_page.course
        except Course.DoesNotExist:
            pass
        else:
            raise PermissionDenied(_("You can't snapshot a snapshot."))

    site = page.node.site

    # User can only snapshot pages he can see
    can_snapshot = page_permissions.user_can_change_page(user, page, site)

    if can_snapshot:
        # User can only snapshot a page if he has the permission to add a page under it.
        can_snapshot = page_permissions.user_can_add_subpage(user, page, site)

    if not can_snapshot:
        raise PermissionDenied(
            _("You don't have sufficient permissions to snapshot this page.")
        )
    if simulate_only:
        return None

    # Copy the page as its own child with its extension.
    # Titles are set to a timestamp in each language of the original page
    snapshot_page = page.copy(
        site, parent_node=page.node, translations=False, extensions=True
    )

    # The snapshot title and slug is set to a timestamp of the time of snapshot. It is
    # published only in languages for which the original course page was published.
    for language in page.get_languages():
        base = page.get_path(language)
        timestamp = str(int(time.time()))
        snapshot_title = _("Snapshot of {:s}").format(page.get_title(language))
        create_title(
            language=language,
            menu_title=timestamp,
            title="{:s} - {:s}".format(timestamp, snapshot_title),
            slug=timestamp,
            path="{:s}/{:s}".format(base, timestamp) if base else timestamp,
            page=snapshot_page,
        )
        if page.is_published(language) is True:
            snapshot_page.publish(language)

    # Move the existing course run subpages as children of the snapshot
    # Their publication status will be respected
    for subpage in page.get_child_pages().filter(courserun__isnull=False):
        subpage.move_page(snapshot_page.node, position="last-child")

    return snapshot_page


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
                child_info, category.extended_object, should_publish=should_publish
            )
    else:
        # we only return leaf categories (no children)
        yield category

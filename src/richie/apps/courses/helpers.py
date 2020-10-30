"""
Helpers that can be useful throughout Richie's courses app
"""
import time

from django.core.exceptions import PermissionDenied
from django.utils.translation import gettext_lazy as _

from cms.api import create_title
from cms.utils import page_permissions

from .models import Course


def snapshot_course(page, user, simulate_only=False):
    """
    Snapshotting a course is making a copy of the course page with all its permissions and
    extensions, and placing the copy as the first child of the page being snapshotted, then
    moving all the course run of the page being snapshotted as children of the new snapshot
    so we keep record of the course as it was when these course runs were played.
    """
    if not page.publisher_is_draft:
        raise PermissionDenied("You can't snapshot a public page.")

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

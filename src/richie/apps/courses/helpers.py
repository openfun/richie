"""
Helpers that can be useful throughout Richie's courses app
"""

from django.core.exceptions import PermissionDenied
from django.utils import timezone
from django.utils.text import slugify
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

    # User can only snapshot pages he can change
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

    # The snapshot title and slug is set with the date and time of snapshot. It is
    # published only in languages for which the original course page was published.
    now = timezone.now()
    for language in page.get_languages():
        base = page.get_path(language)
        title = page.get_title(language)
        version = _(f"Archived on {now:%Y-%m-%d %H:%M:%S}")
        slug = slugify(version)
        create_title(
            language=language,
            menu_title=version,
            title=_(f"{title:s} ({version!s})"),
            slug=slug,
            path=f"{base!s}/{slug!s}" if base else slug,
            page=snapshot_page,
        )
        if page.is_published(language) is True:
            snapshot_page.publish(language)

    # Change the existing course runs to be related children of the snapshot
    # Their publication status will be respected
    for run in page.course.runs.all():
        run.direct_course = snapshot_page.course
        run.save()

    if page.publisher_public and snapshot_page.publisher_public:
        for run in page.publisher_public.course.runs.all():
            run.direct_course = snapshot_page.publisher_public.course
            run.save()

    return snapshot_page

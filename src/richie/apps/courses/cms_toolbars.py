"""
Toolbar extension for the courses application
"""

from django.utils.text import capfirst
from django.utils.translation import gettext_lazy as _

from cms.api import get_page_draft
from cms.extensions.toolbar import ExtensionToolbar
from cms.toolbar_pool import toolbar_pool
from cms.utils.page_permissions import user_can_add_subpage, user_can_change_page
from cms.utils.urlutils import admin_reverse

from .defaults import PAGE_EXTENSION_TOOLBAR_ITEM_POSITION
from .models import Category, Course, Organization, Person


class BaseExtensionToolbar(ExtensionToolbar):
    """
    This extension class customizes the toolbar for our page extensions.

    It must be inherited to define the `model` class attribute.
    """

    def populate(self):
        """
        When visiting a page that is linked to a page extension, show an item in the toolbar only
        to users who have the permission to update the page.

        Clicking on this menu item will open the admin page of the page extension.

        Note: We don't want to show a link to create a new page extension on a page that does not
        have it yet. For clarity, we choose to only create page extensions transparently via the
        page creation wizard.
        """
        # always use draft if we have a page
        self.page = get_page_draft(self.request.current_page)
        if not self.page:
            # Nothing to do
            return

        if user_can_change_page(user=self.request.user, page=self.page):
            # Add page extension edition menu item
            page_extension, admin_url = self.get_page_extension_admin()
            if page_extension:
                edit_mode_inactive = not self.toolbar.edit_mode_active
                page_menu = self.toolbar.get_or_create_menu("page")
                # Create the new menu item as a modal
                page_menu.add_modal_item(
                    _("{!s} settings").format(
                        capfirst(str(self.model._meta.verbose_name))
                    ),
                    url=admin_url,
                    disabled=edit_mode_inactive,
                    position=PAGE_EXTENSION_TOOLBAR_ITEM_POSITION,
                )


@toolbar_pool.register
class CategoryExtensionToolbar(BaseExtensionToolbar):
    """
    This extension class customizes the toolbar for the category page extension
    """

    model = Category


@toolbar_pool.register
class CourseExtensionToolbar(BaseExtensionToolbar):
    """
    This extension class customizes the toolbar for the course page extension
    """

    model = Course

    def populate(self):
        super().populate()
        if not self.page:
            # Nothing to do
            return

        if user_can_change_page(
            user=self.request.user, page=self.page
        ) and user_can_add_subpage(self.request.user, self.page):
            # Add snapshot menu item only on course pages
            try:
                course = Course.objects.only("id").get(extended_object=self.page)
            except Course.DoesNotExist:
                return

            # Course snapshots can not be snapshotted
            if self.page.parent_page:
                try:
                    self.page.parent_page.course
                except Course.DoesNotExist:
                    pass
                else:
                    return

            url = admin_reverse("cms_course_snapshot", kwargs={"course_id": course.id})
            edit_mode_inactive = not self.toolbar.edit_mode_active
            page_menu = self.toolbar.get_or_create_menu("page")
            # Create the new menu item as an Ajax call
            page_menu.add_ajax_item(
                _("Snapshot this page..."),
                action=url,
                data={},
                question=_(
                    "This will place a copy of this page as its child and move all its course"
                    "runs as children of its new copy."
                ),
                on_success=self.toolbar.REFRESH_PAGE,
                disabled=edit_mode_inactive,
                position=PAGE_EXTENSION_TOOLBAR_ITEM_POSITION - 1,
            )


@toolbar_pool.register
class OrganizationExtensionToolbar(BaseExtensionToolbar):
    """
    This extension class customizes the toolbar for the organization page extension
    """

    model = Organization


@toolbar_pool.register
class PersonExtensionToolbar(BaseExtensionToolbar):
    """
    This extension class customizes the toolbar for the person page extension
    """

    model = Person

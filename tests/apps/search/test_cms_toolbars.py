"""Test suite of the toolbar extension for search related it pages
"""

from django.contrib.auth.models import AnonymousUser, Permission

from cms.api import create_page
from cms.test_utils.testcases import CMSTestCase
from cms.toolbar.items import AjaxItem

from richie.apps.core.factories import UserFactory

from ..core.utils import CheckToolbarMixin


# pylint: disable=too-many-ancestors
class SearchCMSToolbarTestCase(CheckToolbarMixin, CMSTestCase):
    """Testing the integration of search related items in the toolbar."""

    def test_cms_toolbars_search_bootstrap_elasticsearch(self):
        """
        Validate that the link to bootstrap elasticsearch is present on any page
        but only for staff users with the required permission.
        """
        superuser = UserFactory(is_staff=True, is_superuser=True)
        staff_with_permission = UserFactory(is_staff=True)
        user_with_permission = UserFactory()
        staff = UserFactory(is_staff=True)
        user = UserFactory()
        anonymous = AnonymousUser()

        # Add permission to bootstrap ES for users concerned
        can_manage = Permission.objects.get(codename="can_manage_elasticsearch")
        staff_with_permission.user_permissions.add(can_manage)
        user_with_permission.user_permissions.add(can_manage)

        cases = [
            (superuser, self.check_active),
            (staff_with_permission, self.check_active),
            (staff, self.check_missing),
            (user_with_permission, self.check_absent),
            (user, self.check_absent),
            (anonymous, self.check_absent),
        ]

        # Create a page with nothing special
        page = create_page(
            "A page", template="richie/single_column.html", language="en"
        )

        for user, method in cases:
            toolbar = self.get_toolbar_for_page(page, user)
            item = method(toolbar, "Regenerate search index...", item_type=AjaxItem)
            if item:
                self.assertEqual(item.action, "/api/v1.0/bootstrap-elasticsearch/")

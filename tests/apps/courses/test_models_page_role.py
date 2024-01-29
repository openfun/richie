"""
Unit tests for the PageRole model
"""

from django.contrib.auth.models import Group
from django.core.exceptions import ObjectDoesNotExist
from django.test import TestCase

from filer.models import Folder

from richie.apps.courses.factories import PageFactory
from richie.apps.courses.models import PageRole


class PageRoleModelsTestCase(TestCase):
    """
    Unit test suite to validate the behavior of the PageRole model
    """

    def test_models_page_role_str(self):
        """
        The string representation should be built with the page title and the
        role display name.
        """
        page = PageFactory(title__title="My page")
        role = PageRole.objects.create(page=page, role="ADMIN")

        self.assertEqual(str(role), "Admin | My page")

    def test_models_page_role_group_and_folder(self, *_):
        """
        A group and a folder should be automatically created the first time the page role is
        saved.
        """
        page = PageFactory(title__title="My page")
        role = PageRole(page=page, role="ADMIN")

        with self.assertRaises(ObjectDoesNotExist):
            self.assertEqual(role.group._meta.model, Group)

        with self.assertRaises(ObjectDoesNotExist):
            self.assertEqual(role.folder._meta.model, Folder)

        # Now save the object and check that the group and folder fields were populated
        role.save()

        self.assertEqual(role.group._meta.model, Group)
        self.assertEqual(role.folder._meta.model, Folder)

        self.assertEqual(role.group.name, "Admin | My page")
        self.assertEqual(role.folder.name, "Admin | My page")

    def test_models_page_role_name_conflict(self, *_):
        """
        Creating page roles for 2 pages sharing the same title should not fail and should add
        the id of the second page to the name of its group and folder to make it unique.
        """
        page1, page2 = PageFactory.create_batch(2, title__title="My page")
        role1 = PageRole.objects.create(page=page1, role="ADMIN")
        role2 = PageRole.objects.create(page=page2, role="ADMIN")

        self.assertEqual(role1.group.name, "Admin | My page")
        self.assertEqual(role1.folder.name, "Admin | My page")

        self.assertEqual(role2.group.name, f"Admin | My page [{page2.id:d}]")
        self.assertEqual(role2.folder.name, f"Admin | My page [{page2.id:d}]")

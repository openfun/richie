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

    def test_models_page_role_django_permissions_group_admin(self, *_):
        """
        A group should be automatically created the first time the page role is saved.
        """
        page = PageFactory(title__title="My page")
        role = PageRole(page=page, role="ADMIN")

        with self.assertRaises(ObjectDoesNotExist):
            self.assertEqual(role.folder._meta.model, Folder)

        with self.assertRaises(ObjectDoesNotExist):
            self.assertEqual(role.folder._meta.model, Folder)

        # Now save the object and check that the group and folder fields were populated
        role.save()

        self.assertEqual(role.group._meta.model, Group)
        self.assertEqual(role.folder._meta.model, Folder)

        self.assertEqual(role.group.name, "Admin | My page")
        self.assertEqual(role.folder.name, "Admin | My page")

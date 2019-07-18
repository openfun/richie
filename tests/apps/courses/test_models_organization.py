"""
Unit tests for the Organization model
"""
import random
from unittest import mock

from django.core.exceptions import ValidationError
from django.test import TestCase
from django.test.utils import override_settings

from cms.api import add_plugin, create_page
from cms.models import PagePermission
from filer.models import FolderPermission

from richie.apps.core.factories import PageFactory
from richie.apps.core.helpers import create_i18n_page
from richie.apps.courses import defaults
from richie.apps.courses.cms_plugins import OrganizationPlugin
from richie.apps.courses.factories import (
    CourseFactory,
    OrganizationFactory,
    PersonFactory,
)
from richie.apps.courses.models import Course, Organization, Person


class OrganizationModelsTestCase(TestCase):
    """
    Unit test suite to validate the behavior of the Organization model
    """

    def test_models_organization_fields_code_normalization(self):
        """
        The `code` field should be normalized to improve its uniqueness
        Test with a chinese character, an emoji and a french ç...
        """
        organization = OrganizationFactory(code=" r5G yç👷学pm 44 ")
        self.assertEqual(organization.code, "R5G-YÇ学PM-44")

    def test_models_organization_fields_code_required(self):
        """
        The `code` field should not be required
        """
        organization = OrganizationFactory(code=None)
        self.assertIsNone(organization.code)

    def test_models_organization_fields_code_unique(self):
        """
        The `code` field should be unique
        """
        organization = OrganizationFactory(code="the-unique-code")

        # Creating a second organization with the same code should raise an error...
        with self.assertRaises(ValidationError) as context:
            OrganizationFactory(code="the-unique-code")
        self.assertEqual(
            context.exception.messages[0],
            "An Organization already exists with this code.",
        )
        self.assertEqual(Organization.objects.filter(code="THE-UNIQUE-CODE").count(), 1)

        # ... but the page extension can exist in draft and published versions
        organization.extended_object.publish("en")
        self.assertEqual(Organization.objects.filter(code="THE-UNIQUE-CODE").count(), 2)

    def test_models_organization_fields_code_max_length(self):
        """
        The `code` field should be limited to 100 characters
        """
        OrganizationFactory(code="a" * 100)
        with self.assertRaises(ValidationError) as context:
            OrganizationFactory(code="b" * 101)
        self.assertEqual(
            context.exception.messages[0],
            "Ensure this value has at most 100 characters (it has 101).",
        )

    def test_models_organization_str(self):
        """
        The str representation should be built with the page title and code field only.
        A query to the associated page should be generated.
        """
        page = create_page("La Sorbonne", "courses/cms/organization_detail.html", "en")
        organization = Organization(code="SOR", extended_object=page)
        with self.assertNumQueries(1):
            self.assertEqual(str(organization), "Organization: La Sorbonne (SOR)")

    def test_models_organization_create_page_role(self, *_):
        """
        If the CMS_PERMISSIONS settings is True, a page role should be created when saving
        an organization.
        """
        role_dict = {
            "django_permissions": ["cms.change_page"],
            "organization_page_permissions": {
                "can_change": random.choice([True, False]),
                "can_add": random.choice([True, False]),
                "can_delete": random.choice([True, False]),
                "can_change_advanced_settings": random.choice([True, False]),
                "can_publish": random.choice([True, False]),
                "can_change_permissions": random.choice([True, False]),
                "can_move_page": random.choice([True, False]),
                "can_view": False,  # can_view = True would make it a view restriction...
                "grant_on": random.randint(1, 5),
            },
            "organization_folder_permissions": {
                "can_read": random.choice([True, False]),
                "can_edit": random.choice([True, False]),
                "can_add_children": random.choice([True, False]),
                "type": random.randint(0, 2),
            },
        }
        page = PageFactory(title__title="My title")
        organization = OrganizationFactory(extended_object=page)
        self.assertFalse(page.roles.exists())

        with mock.patch.dict(defaults.ORGANIZATION_ADMIN_ROLE, role_dict):
            organization.create_page_role()

        # A page role should have been created
        self.assertEqual(page.roles.count(), 1)
        role = page.roles.get(role="ADMIN")
        self.assertEqual(role.group.name, "Admin | My title")
        self.assertEqual(role.group.permissions.count(), 1)
        self.assertEqual(role.folder.name, "Admin | My title")

        # All expected permissions should have been assigned to the group:
        # - Django permissions
        self.assertEqual(role.group.permissions.first().codename, "change_page")
        # - DjangoCMS page permissions
        self.assertEqual(PagePermission.objects.filter(group=role.group).count(), 1)
        page_permission = PagePermission.objects.get(group=role.group)
        for key, value in role_dict["organization_page_permissions"].items():
            self.assertEqual(getattr(page_permission, key), value)
        # The Django Filer folder permissions
        self.assertEqual(
            FolderPermission.objects.filter(group_id=role.group_id).count(), 1
        )
        folder_permission = FolderPermission.objects.get(group_id=role.group_id)
        for key, value in role_dict["organization_folder_permissions"].items():
            self.assertEqual(getattr(folder_permission, key), value)

    @override_settings(CMS_PERMISSION=False)
    def test_models_organization_create_page_role_cms_permissions_off(self, *_):
        """
        A page role should not be created for organizations when the CMS_PERMISSIONS setting is set
        to False.
        """
        organization = OrganizationFactory()
        self.assertIsNone(organization.create_page_role())
        self.assertFalse(organization.extended_object.roles.exists())

    def test_models_organization_create_page_role_public_page(self, *_):
        """
        A page role should not be created for the public version of an organization.
        """
        organization = OrganizationFactory(should_publish=True).public_extension
        self.assertIsNone(organization.create_page_role())
        self.assertFalse(organization.extended_object.roles.exists())

    def test_models_organization_get_courses(self):
        """
        It should be possible to retrieve the list of related courses on the organization instance.
        The number of queries should be minimal.
        """
        organization = OrganizationFactory(should_publish=True)
        courses = CourseFactory.create_batch(
            3,
            page_title="my title",
            fill_organizations=[organization],
            should_publish=True,
        )
        retrieved_courses = organization.get_courses()

        with self.assertNumQueries(2):
            self.assertEqual(set(retrieved_courses), set(courses))

        with self.assertNumQueries(0):
            for course in retrieved_courses:
                self.assertEqual(
                    course.extended_object.prefetched_titles[0].title, "my title"
                )

    def test_models_organization_get_courses_public_organization_page(self):
        """
        When a organization is added on a draft course, the course should not be visible on
        the public organization page until the course is published.
        """
        organization = OrganizationFactory(should_publish=True)
        organization_page = organization.extended_object
        course = CourseFactory(page_title="my title", should_publish=True)
        course_page = course.extended_object

        # Add a organization to the course but don't publish the modification
        placeholder = course_page.placeholders.get(slot="course_organizations")
        add_plugin(placeholder, OrganizationPlugin, "en", page=organization_page)

        self.assertEqual(list(organization.get_courses()), [course])
        self.assertEqual(list(organization.public_extension.get_courses()), [])

        # Now publish the modification and check that the course is displayed
        # on the public organization page
        course.extended_object.publish("en")
        self.assertEqual(
            list(organization.public_extension.get_courses()), [course.public_extension]
        )

    def test_models_organization_get_courses_several_languages(self):
        """
        The courses should not be duplicated if they exist in several languages.
        """
        organization = OrganizationFactory(should_publish=True)
        CourseFactory(
            page_title={"en": "my title", "fr": "mon titre"},
            fill_organizations=[organization],
            should_publish=True,
        )
        self.assertEqual(Course.objects.count(), 2)
        self.assertEqual(organization.get_courses().count(), 1)

    def test_models_organization_get_courses_snapshots(self):
        """
        Snapshot courses should be excluded from the list of courses returned.
        The new filter query we added to exclude snapshots should not create duplicates.
        Indeed, we had to add a "distinct" clause to the query so this test enforces it.
        """
        # We create a root page because it was responsible for duplicate results when the
        # distinct clause is not applied.
        # This is because of the clause "extended_object__node__parent__cms_pages__..."
        # which is there to exclude snapshots but also acts on the main course page and
        # checks its parent (so the root page) and the duplicate comes from the fact that
        # the parent has a draft and a public page... so "cms_pages" has a cardinality of 2
        root_page = create_i18n_page("my title", published=True)

        organization = OrganizationFactory(should_publish=True)
        course = CourseFactory(
            page_parent=root_page,
            fill_organizations=[organization],
            should_publish=True,
        )
        CourseFactory(
            page_parent=course.extended_object,
            fill_organizations=[organization],
            should_publish=True,
        )

        self.assertEqual(Course.objects.count(), 4)
        self.assertEqual(organization.get_courses().count(), 1)
        self.assertEqual(organization.public_extension.get_courses().count(), 1)

    def test_models_organization_get_persons(self):
        """
        It should be possible to retrieve the list of related persons on the organization instance.
        The number of queries should be minimal.
        """
        organization = OrganizationFactory(should_publish=True)
        persons = PersonFactory.create_batch(
            2,
            page_title="my title",
            should_publish=True,
            fill_organizations=[organization],
        )
        retrieved_persons = organization.get_persons()

        with self.assertNumQueries(2):
            self.assertEqual(set(retrieved_persons), set(persons))

        with self.assertNumQueries(0):
            for person in retrieved_persons:
                self.assertEqual(
                    person.extended_object.prefetched_titles[0].title, "my title"
                )

    def test_models_organization_get_persons_public_organization_page(self):
        """
        When a organization is added on a draft person, the person should not be visible on
        the public organization page until the person is published.
        """
        organization = OrganizationFactory(should_publish=True)
        organization_page = organization.extended_object
        person = PersonFactory(page_title="my title", should_publish=True)
        person_page = person.extended_object

        # Add a organization to the person but don't publish the modification
        placeholder = person_page.placeholders.get(slot="organizations")
        add_plugin(placeholder, OrganizationPlugin, "en", page=organization_page)

        self.assertEqual(list(organization.get_persons()), [person])
        self.assertEqual(list(organization.public_extension.get_persons()), [])

        # Now publish the modification and check that the person is displayed
        # on the public organization page
        person.extended_object.publish("en")
        self.assertEqual(
            list(organization.public_extension.get_persons()), [person.public_extension]
        )

    def test_models_organization_get_persons_several_languages(self):
        """
        The persons should not be duplicated if they exist in several languages.
        """
        organization = OrganizationFactory(should_publish=True)
        PersonFactory(
            page_title={"en": "my title", "fr": "mon titre"},
            fill_organizations=[organization],
            should_publish=True,
        )
        self.assertEqual(Person.objects.count(), 2)
        self.assertEqual(organization.get_persons().count(), 1)

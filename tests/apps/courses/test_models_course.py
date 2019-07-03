"""
Unit tests for the Course model
"""
import random
from unittest import mock

from django.core.exceptions import ValidationError
from django.test import TestCase
from django.test.client import RequestFactory
from django.test.utils import override_settings
from django.utils import translation

from cms.api import add_plugin, create_page
from cms.models import PagePermission
from filer.models import FolderPermission

from richie.apps.core.factories import PageFactory
from richie.apps.courses import defaults
from richie.apps.courses.factories import (
    CategoryFactory,
    CourseFactory,
    CourseRunFactory,
    OrganizationFactory,
    PageRoleFactory,
    PersonFactory,
)
from richie.apps.courses.models import Course, CourseRun

# pylint: disable=too-many-public-methods


class CourseModelsTestCase(TestCase):
    """
    Unit test suite to validate the behavior of the Course model
    """

    def test_models_course_str(self):
        """
        The string representation should be built with the page `title`
        fields. Only 1 query to the associated page should be generated.
        """
        page = create_page("Nano particles", "courses/cms/course_detail.html", "en")
        course = CourseFactory(extended_object=page)
        with self.assertNumQueries(2):
            self.assertEqual(str(course), "Course: Nano particles")

    def test_models_course_create_page_role(self, *_):
        """
        If the CMS_PERMISSIONS settings is True, a page role should be created when saving
        a course.
        """
        role_dict = {
            "django_permissions": ["cms.change_page"],
            "course_page_permissions": {
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
            "course_folder_permissions": {
                "can_read": random.choice([True, False]),
                "can_edit": random.choice([True, False]),
                "can_add_children": random.choice([True, False]),
                "type": random.randint(0, 2),
            },
        }
        page = PageFactory(title__title="My title")
        course = CourseFactory(extended_object=page)
        self.assertFalse(page.roles.exists())

        with mock.patch.dict(defaults.COURSE_ADMIN_ROLE, role_dict):
            course.create_page_role()

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
        for key, value in role_dict["course_page_permissions"].items():
            self.assertEqual(getattr(page_permission, key), value)
        # The Django Filer folder permissions
        self.assertEqual(
            FolderPermission.objects.filter(group_id=role.group_id).count(), 1
        )
        folder_permission = FolderPermission.objects.get(group_id=role.group_id)
        for key, value in role_dict["course_folder_permissions"].items():
            self.assertEqual(getattr(folder_permission, key), value)

    @override_settings(CMS_PERMISSION=False)
    def test_models_course_create_page_role_cms_permissions_off(self, *_):
        """
        A page role should not be created for courses when the CMS_PERMISSIONS setting is set
        to False.
        """
        course = CourseFactory()
        self.assertIsNone(course.create_page_role())
        self.assertFalse(course.extended_object.roles.exists())

    def test_models_course_create_page_role_public_page(self, *_):
        """
        A page role should not be created for the public version of an course.
        """
        course = CourseFactory(should_publish=True).public_extension
        self.assertIsNone(course.create_page_role())
        self.assertFalse(course.extended_object.roles.exists())

    def test_models_course_create_permissions_for_organization(self, *_):
        """
        If the CMS_PERMISSIONS settings is True, a page and folder permission should be created
        for the course when calling the `create_permissions_for_organization` method.
        """
        role_dict = {
            "courses_page_permissions": {
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
            "courses_folder_permissions": {
                "can_read": random.choice([True, False]),
                "can_edit": random.choice([True, False]),
                "can_add_children": random.choice([True, False]),
                "type": random.randint(0, 2),
            },
        }
        course = CourseFactory()
        PageRoleFactory(page=course.extended_object, role="ADMIN")

        organization = OrganizationFactory()
        organization_role = PageRoleFactory(
            page=organization.extended_object, role="ADMIN"
        )

        with mock.patch.dict(defaults.ORGANIZATION_ADMIN_ROLE, role_dict):
            course.create_permissions_for_organization(organization)

        # All expected permissions should have been assigned to the group:
        # - DjangoCMS page permissions
        self.assertEqual(
            PagePermission.objects.filter(group=organization_role.group).count(), 1
        )
        page_permission = PagePermission.objects.get(group=organization_role.group)
        for key, value in role_dict["courses_page_permissions"].items():
            self.assertEqual(getattr(page_permission, key), value)
        # The Django Filer folder permissions
        self.assertEqual(
            FolderPermission.objects.filter(
                group_id=organization_role.group_id
            ).count(),
            1,
        )
        folder_permission = FolderPermission.objects.get(
            group_id=organization_role.group_id
        )
        for key, value in role_dict["courses_folder_permissions"].items():
            self.assertEqual(getattr(folder_permission, key), value)

    @override_settings(CMS_PERMISSION=False)
    def test_models_course_create_permissions_for_organization_cms_permissions_off(
        self, *_
    ):
        """
        No permissions should be created for courses when the CMS_PERMISSIONS setting is set
        to False.
        """
        course = CourseFactory()
        organization = OrganizationFactory()
        self.assertIsNone(course.create_permissions_for_organization(organization))
        self.assertFalse(PagePermission.objects.exists())
        self.assertFalse(FolderPermission.objects.exists())

    def test_models_course_create_permissions_for_organization_public_page(self, *_):
        """No permissions should be created for the public version of an course."""
        course = CourseFactory(should_publish=True).public_extension
        organization = OrganizationFactory(should_publish=True).public_extension
        self.assertIsNone(course.create_permissions_for_organization(organization))
        self.assertFalse(PagePermission.objects.exists())
        self.assertFalse(FolderPermission.objects.exists())

    def test_models_course_get_categories_empty(self):
        """
        For a course not linked to any category the method `get_categories` should
        return an empty query.
        """
        course = CourseFactory(should_publish=True)
        self.assertFalse(course.get_categories().exists())
        self.assertFalse(course.public_extension.get_categories().exists())

    def test_models_course_get_categories(self):
        """
        The `get_categories` method should return all categories linked to a course and
        should respect publication status.
        """
        # The 2 first categories are grouped in one variable name and will be linked to the
        # course in the following, the third category will not be linked so we can check that
        # only the categories linked to the course are retrieved (its name starts with `_`
        # because it is not used and only here for unpacking purposes)
        *draft_categories, _other_draft = CategoryFactory.create_batch(3)
        *published_categories, _other_public = CategoryFactory.create_batch(
            3, should_publish=True
        )
        course = CourseFactory(
            fill_categories=draft_categories + published_categories, should_publish=True
        )

        self.assertEqual(
            list(course.get_categories()), draft_categories + published_categories
        )
        self.assertEqual(
            list(course.public_extension.get_categories()), published_categories
        )

    def test_models_course_get_categories_language(self):
        """
        The `get_categories` method should only return categories linked to a course by
        a plugin in the current language.
        """
        category_fr = CategoryFactory(page_languages=["fr"])
        category_en = CategoryFactory(page_languages=["en"])

        course = CourseFactory(should_publish=True)
        placeholder = course.extended_object.placeholders.get(slot="course_categories")

        add_plugin(
            language="en",
            placeholder=placeholder,
            plugin_type="CategoryPlugin",
            page=category_en.extended_object,
        )
        add_plugin(
            language="fr",
            placeholder=placeholder,
            plugin_type="CategoryPlugin",
            page=category_fr.extended_object,
        )

        with translation.override("fr"):
            self.assertEqual(list(course.get_categories()), [category_fr])

        with translation.override("en"):
            self.assertEqual(list(course.get_categories()), [category_en])

    def test_models_course_get_categories_other_placeholders(self):
        """
        The `get_categories` method should return all categories linked to a course via a plugin
        on whichever placeholder.
        """
        category1, category2 = CategoryFactory.create_batch(2)

        course = CourseFactory(should_publish=True)
        placeholder1 = course.extended_object.placeholders.get(
            slot="course_description"
        )
        placeholder2 = course.extended_object.placeholders.get(slot="course_format")

        add_plugin(
            language="en",
            placeholder=placeholder1,
            plugin_type="CategoryPlugin",
            page=category1.extended_object,
        )
        add_plugin(
            language="en",
            placeholder=placeholder2,
            plugin_type="CategoryPlugin",
            page=category2.extended_object,
        )

        self.assertEqual(list(course.get_categories()), [category1, category2])

    def test_models_course_get_organizations_empty(self):
        """
        For a course not linked to any organzation the method `get_organizations` should
        return an empty query.
        """
        course = CourseFactory(should_publish=True)
        self.assertFalse(course.get_organizations().exists())
        self.assertFalse(course.public_extension.get_organizations().exists())

    def test_models_course_get_organizations(self):
        """
        The `get_organizations` method should return all organizations linked to a course and
        should respect publication status.
        """
        # The 2 first organizations are grouped in one variable name and will be linked to the
        # course in the following, the third category will not be linked so we can check that
        # only the organizations linked to the course are retrieved (its name starts with `_`
        # because it is not used and only here for unpacking purposes)
        *draft_organizations, _other_draft = OrganizationFactory.create_batch(3)
        *published_organizations, _other_public = OrganizationFactory.create_batch(
            3, should_publish=True
        )
        course = CourseFactory(
            fill_organizations=draft_organizations + published_organizations,
            should_publish=True,
        )

        self.assertEqual(
            list(course.get_organizations()),
            draft_organizations + published_organizations,
        )
        self.assertEqual(
            list(course.public_extension.get_organizations()), published_organizations
        )

    def test_models_course_get_organizations_language(self):
        """
        The `get_organizations` method should only return organizations linked to a course by
        a plugin in the current language.
        """
        organization_fr = OrganizationFactory(page_languages=["fr"])
        organization_en = OrganizationFactory(page_languages=["en"])

        course = CourseFactory(should_publish=True)
        placeholder = course.extended_object.placeholders.get(
            slot="course_organizations"
        )

        add_plugin(
            language="en",
            placeholder=placeholder,
            plugin_type="OrganizationPlugin",
            page=organization_en.extended_object,
        )
        add_plugin(
            language="fr",
            placeholder=placeholder,
            plugin_type="OrganizationPlugin",
            page=organization_fr.extended_object,
        )

        with translation.override("fr"):
            self.assertEqual(list(course.get_organizations()), [organization_fr])

        with translation.override("en"):
            self.assertEqual(list(course.get_organizations()), [organization_en])

    def test_models_course_get_organizations_other_placeholders(self):
        """
        The `get_organizations` method should return all organizations linked to a course via a
        plugin on whichever placeholder.
        """
        organization1, organization2 = OrganizationFactory.create_batch(2)

        course = CourseFactory(should_publish=True)
        placeholder1 = course.extended_object.placeholders.get(
            slot="course_description"
        )
        placeholder2 = course.extended_object.placeholders.get(slot="course_format")

        add_plugin(
            language="en",
            placeholder=placeholder1,
            plugin_type="OrganizationPlugin",
            page=organization1.extended_object,
        )
        add_plugin(
            language="en",
            placeholder=placeholder2,
            plugin_type="OrganizationPlugin",
            page=organization2.extended_object,
        )

        self.assertEqual(
            list(course.get_organizations()), [organization1, organization2]
        )

    def test_models_course_get_main_organization_empty(self):
        """
        For a course not linked to any organzation the method `get_main_organization` should
        return `None`.
        """
        course = CourseFactory(should_publish=True)
        self.assertIsNone(course.get_main_organization())
        self.assertIsNone(course.public_extension.get_main_organization())

    def test_models_course_get_main_organization(self):
        """
        The `get_main_organization` method should return the first organization linked to a
        course via plugins, respecting publication status.
        """
        # The 2 first organizations are grouped in one variable name and will be linked to the
        # course in the following, the third category will not be linked so we can check that
        # only the organizations linked to the course are retrieved (its name starts with `_`
        # because it is not used and only here for unpacking purposes)
        *draft_organizations, _other_draft = OrganizationFactory.create_batch(3)
        *published_organizations, _other_public = OrganizationFactory.create_batch(
            3, should_publish=True
        )
        course = CourseFactory(
            fill_organizations=draft_organizations + published_organizations,
            should_publish=True,
        )

        self.assertEqual(course.get_main_organization(), draft_organizations[0])
        self.assertEqual(
            course.public_extension.get_main_organization(), published_organizations[0]
        )

    def test_models_course_get_persons_empty(self):
        """
        For a course not linked to any person the method `get_persons` should
        return an empty query.
        """
        course = CourseFactory(should_publish=True)
        self.assertFalse(course.get_persons().exists())
        self.assertFalse(course.public_extension.get_persons().exists())

    def test_models_course_get_persons(self):
        """
        The `get_persons` method should return all persons linked to a course and
        should respect publication status.
        """
        # The 2 first persons are grouped in one variable name and will be linked to the
        # course in the following, the third person will not be linked so we can check that
        # only the persons linked to the course are retrieved (its name starts with `_`
        # because it is not used and only here for unpacking purposes)
        *draft_persons, _other_draft = PersonFactory.create_batch(3)
        *published_persons, _other_public = PersonFactory.create_batch(
            3, should_publish=True
        )
        course = CourseFactory(
            fill_team=draft_persons + published_persons, should_publish=True
        )

        self.assertEqual(list(course.get_persons()), draft_persons + published_persons)
        self.assertEqual(list(course.public_extension.get_persons()), published_persons)

    def test_models_course_get_persons_language(self):
        """
        The `get_persons` method should only return persons linked to a course by a plugin
        in the current language.
        """
        person_fr = PersonFactory(page_languages=["fr"])
        person_en = PersonFactory(page_languages=["en"])

        course = CourseFactory(should_publish=True)
        placeholder = course.extended_object.placeholders.get(slot="course_team")

        add_plugin(
            language="en",
            placeholder=placeholder,
            plugin_type="PersonPlugin",
            page=person_en.extended_object,
        )
        add_plugin(
            language="fr",
            placeholder=placeholder,
            plugin_type="PersonPlugin",
            page=person_fr.extended_object,
        )

        with translation.override("fr"):
            self.assertEqual(list(course.get_persons()), [person_fr])

        with translation.override("en"):
            self.assertEqual(list(course.get_persons()), [person_en])

    def test_models_course_get_persons_other_placeholders(self):
        """
        The `get_persons` method should return all persons linked to a course via a plugin
        on whichever placeholder.
        """
        person1, person2 = PersonFactory.create_batch(2)

        course = CourseFactory(should_publish=True)
        placeholder1 = course.extended_object.placeholders.get(
            slot="course_description"
        )
        placeholder2 = course.extended_object.placeholders.get(slot="course_format")

        add_plugin(
            language="en",
            placeholder=placeholder1,
            plugin_type="PersonPlugin",
            page=person1.extended_object,
        )
        add_plugin(
            language="en",
            placeholder=placeholder2,
            plugin_type="PersonPlugin",
            page=person2.extended_object,
        )

        self.assertEqual(list(course.get_persons()), [person1, person2])

    def test_models_course_get_course_runs_empty(self):
        """
        For a course without course runs the methods `get_course_runs` and
        `get_course_runs_for_language` should return an empty query.
        """
        course = CourseFactory(should_publish=True)
        self.assertFalse(course.get_course_runs().exists())
        self.assertFalse(course.get_course_runs_for_language().exists())
        self.assertFalse(course.public_extension.get_course_runs().exists())
        self.assertFalse(
            course.public_extension.get_course_runs_for_language().exists()
        )

    def test_models_course_get_course_runs(self):
        """
        The `get_course_runs` and `get_course_runs_for_language` methods should return all
        descendants ranked by path, not only children and should respect publication status.
        """
        course = CourseFactory(page_languages=["en", "fr"], should_publish=True)

        # Create draft and published course runs for this course
        # We want to test 4 situations:
        # - a draft course run
        # - a course run published in the current language
        # - a course run published in another language
        # - a course run published in the current language that was then unpublished
        course_runs = CourseRunFactory.create_batch(
            3, page_parent=course.extended_object, page_languages=["en"]
        )
        self.assertTrue(course_runs[0].extended_object.publish("en"))
        self.assertTrue(course_runs[1].extended_object.publish("en"))
        self.assertTrue(course_runs[1].extended_object.unpublish("en"))

        course_run_fr = CourseRunFactory(
            page_parent=course.extended_object,
            page_languages=["fr"],
            should_publish=True,
        )

        # Create a child course with draft and published course runs (what results from
        # snapshotting a course)
        child_course = CourseFactory(
            page_languages=["en", "fr"],
            page_parent=course.extended_object,
            should_publish=True,
        )
        child_course_runs = CourseRunFactory.create_batch(
            3, page_parent=child_course.extended_object, page_languages=["en"]
        )
        self.assertTrue(child_course_runs[0].extended_object.publish("en"))
        self.assertTrue(child_course_runs[1].extended_object.publish("en"))
        self.assertTrue(child_course_runs[1].extended_object.unpublish("en"))

        child_course_run_fr = CourseRunFactory(
            page_parent=child_course.extended_object,
            page_languages=["fr"],
            should_publish=True,
        )

        # Create another course, not related to the first one, with draft and published course runs
        other_course = CourseFactory(page_languages=["en", "fr"], should_publish=True)
        other_course_runs = CourseRunFactory.create_batch(
            3, page_parent=other_course.extended_object, page_languages=["en"]
        )
        self.assertTrue(other_course_runs[0].extended_object.publish("en"))
        self.assertTrue(other_course_runs[1].extended_object.publish("en"))
        self.assertTrue(other_course_runs[1].extended_object.unpublish("en"))

        CourseRunFactory(
            page_parent=other_course.extended_object,
            page_languages=["fr"],
            should_publish=True,
        )

        # Check that the draft course retrieves all its descendant course runs
        # 3 draft course runs and 2 published course runs per course
        self.assertEqual(CourseRun.objects.count(), 3 * (4 + 3))

        with self.assertNumQueries(2):
            self.assertEqual(
                list(course.get_course_runs()),
                course_runs
                + [course_run_fr]
                + child_course_runs
                + [child_course_run_fr],
            )

        with self.assertNumQueries(1):
            self.assertEqual(
                list(course.get_course_runs_for_language(language="en")),
                course_runs + child_course_runs,
            )

        # Check that the published course retrieves only the published descendant course runs
        course_runs[0].refresh_from_db()
        child_course_runs[0].refresh_from_db()
        public_course = course.public_extension

        with self.assertNumQueries(3):
            result = list(public_course.get_course_runs())
        self.assertEqual(
            result,
            [
                course_runs[0].public_extension,
                course_run_fr.public_extension,
                child_course_runs[0].public_extension,
                child_course_run_fr.public_extension,
            ],
        )

        with self.assertNumQueries(1):
            result = list(public_course.get_course_runs_for_language(language="en"))
        self.assertEqual(
            result,
            [course_runs[0].public_extension, child_course_runs[0].public_extension],
        )

    def test_models_course_get_root_to_leaf_category_pages_leaf(self):
        """
        A course linked to a leaf category, in a nested category tree, should be associated
        with all the category's ancestors.
        """
        # Create nested categories
        create_page("Categories", "richie/single_column.html", "en")
        meta_category = CategoryFactory(should_publish=True)
        parent_category = CategoryFactory(
            page_parent=meta_category.extended_object, should_publish=True
        )
        leaf_category = CategoryFactory(
            page_parent=parent_category.extended_object, should_publish=True
        )

        course = CourseFactory(fill_categories=[leaf_category], should_publish=True)

        expected_pages = [
            parent_category.public_extension.extended_object,
            leaf_category.public_extension.extended_object,
        ]
        self.assertEqual(expected_pages, list(course.get_root_to_leaf_category_pages()))

    def test_models_course_get_root_to_leaf_category_pages_parent(self):
        """
        A course linked to a parent category, in a nested category tree, should be associated
        with all the category's ancestors, but not we the child.
        """
        # Create nested categories
        create_page("Categories", "richie/single_column.html", "en")
        meta_category = CategoryFactory(should_publish=True)
        parent_category = CategoryFactory(
            page_parent=meta_category.extended_object, should_publish=True
        )
        CategoryFactory(
            page_parent=parent_category.extended_object, should_publish=True
        )

        course = CourseFactory(fill_categories=[parent_category], should_publish=True)

        expected_pages = [parent_category.public_extension.extended_object]
        self.assertEqual(expected_pages, list(course.get_root_to_leaf_category_pages()))

    def test_models_course_get_root_to_leaf_category_pages_duplicate(self):
        """
        If the course is linked to several categories, the ancestor categories should not get
        duplicated.
        """
        # Create nested categories
        create_page("Categories", "richie/single_column.html", "en")
        meta_category = CategoryFactory(should_publish=True)
        parent_category = CategoryFactory(
            page_parent=meta_category.extended_object, should_publish=True
        )
        leaf_category1 = CategoryFactory(
            page_parent=parent_category.extended_object, should_publish=True
        )
        leaf_category2 = CategoryFactory(
            page_parent=parent_category.extended_object, should_publish=True
        )

        course = CourseFactory(
            fill_categories=[leaf_category1, leaf_category2], should_publish=True
        )

        expected_pages = [
            parent_category.public_extension.extended_object,
            leaf_category1.public_extension.extended_object,
            leaf_category2.public_extension.extended_object,
        ]
        self.assertEqual(expected_pages, list(course.get_root_to_leaf_category_pages()))

    # Fields: effort

    def test_models_course_field_effort_null(self):
        """The effort field can be null."""
        course = CourseFactory(effort=None)
        self.assertIsNone(course.effort)
        self.assertEqual(course.get_effort_display(), "")

    def test_models_course_field_effort_invalid(self):
        """An effort should be a triplet: number, time unit and reference unit."""
        with self.assertRaises(ValidationError) as context:
            CourseFactory(effort=[5, "unit"])
        self.assertEqual(
            context.exception.messages[0],
            "An effort should be a triplet: number, time unit and reference unit.",
        )

    def test_models_course_field_effort_integer(self):
        """The first value of the effort triplet should be an integer."""
        for value in ["a", "1.0"]:
            with self.assertRaises(ValidationError) as context:
                CourseFactory(effort=[value, "minute", "hour"])
            self.assertEqual(
                context.exception.messages[0],
                "An effort should be a round number of time units.",
            )

    def test_models_course_field_effort_positive(self):
        """The first value should be a positive integer."""
        with self.assertRaises(ValidationError) as context:
            CourseFactory(effort=[-1, "day", "month"])
        self.assertEqual(context.exception.messages[0], "An effort should be positive.")

    def test_models_course_field_effort_invalid_unit(self):
        """The second value should be a valid time unit choice."""
        with self.assertRaises(ValidationError) as context:
            CourseFactory(effort=[1, "invalid", "month"])
        self.assertEqual(
            context.exception.messages[0],
            "invalid is not a valid choice for a time unit.",
        )

    def test_models_course_field_effort_invalid_reference(self):
        """The third value should be a valid time unit choice."""
        with self.assertRaises(ValidationError) as context:
            CourseFactory(effort=[1, "day", "invalid"])
        self.assertEqual(
            context.exception.messages[0],
            "invalid is not a valid choice for a time unit.",
        )

    def test_models_course_field_effort_order(self):
        """The effort unit should be shorter than the reference unit."""
        with self.assertRaises(ValidationError) as context:
            CourseFactory(effort=[1, "day", "day"])
        self.assertEqual(
            context.exception.messages[0],
            "The effort time unit should be shorter than the reference unit.",
        )

    def test_models_course_field_effort_display_singular(self):
        """Validate that a value of 1 time unit is displayed as expected."""
        course = CourseFactory(effort=[1, "day", "week"])
        self.assertEqual(course.get_effort_display(), "1 day/week")

    def test_models_course_field_effort_display_plural(self):
        """Validate that a plural number of time units is displayed as expected."""
        course = CourseFactory(effort=[2, "day", "week"])
        self.assertEqual(course.get_effort_display(), "2 days/week")

    def test_models_course_field_effort_display_request(self):
        """
        When used in the `render_model` template tag, it should not break when passed a
        request argument (the DjangoCMS frontend editing does it).
        """
        course = CourseFactory(effort=[1, "week", "month"])
        request = RequestFactory().get("/")
        self.assertEqual(course.get_effort_display(request), "1 week/month")

    def test_models_course_field_effort_default(self):
        """The effort field should default to None."""
        course = Course.objects.create(extended_object=PageFactory())
        self.assertIsNone(course.effort)

    # Fields: duration

    def test_models_course_field_duration_null(self):
        """The duration field can be null."""
        course = CourseFactory(duration=None)
        self.assertIsNone(course.duration)
        self.assertEqual(course.get_duration_display(), "")

    def test_models_course_field_duration_invalid(self):
        """The duration should be a pair: number and unit."""
        with self.assertRaises(ValidationError) as context:
            CourseFactory(duration=5)
        self.assertEqual(
            context.exception.messages[0],
            "A composite duration should be a pair: number and time unit.",
        )

    def test_models_course_field_duration_integer(self):
        """The first value of the duration pair should be an integer."""
        for value in ["a", "1.0"]:
            with self.assertRaises(ValidationError) as context:
                CourseFactory(duration=[value, "minute"])
            self.assertEqual(
                context.exception.messages[0],
                "A composite duration should be a round number of time units.",
            )

    def test_models_course_field_duration_positive(self):
        """The first value should be a positive integer."""
        with self.assertRaises(ValidationError) as context:
            CourseFactory(duration=[-1, "day"])
        self.assertEqual(
            context.exception.messages[0], "A composite duration should be positive."
        )

    def test_models_course_field_duration_invalid_unit(self):
        """The second value should be a valid time unit choice."""
        with self.assertRaises(ValidationError) as context:
            CourseFactory(duration=[1, "invalid"])
        self.assertEqual(
            context.exception.messages[0],
            "invalid is not a valid choice for a time unit.",
        )

    def test_models_course_field_duration_display_singular(self):
        """Validate that a value of 1 time unit is displayed as expected."""
        course = CourseFactory(duration=[1, "day"])
        self.assertEqual(course.get_duration_display(), "1 day")

    def test_models_course_field_duration_display_plural(self):
        """Validate that a plural number of time units is displayed as expected."""
        course = CourseFactory(duration=[2, "day"])
        self.assertEqual(course.get_duration_display(), "2 days")

    def test_models_course_field_duration_display_request(self):
        """
        When used in the `render_model` template tag, it should not break when passed a
        request argument (the DjangoCMS frontend editing does it).
        """
        course = CourseFactory(duration=[1, "week"])
        request = RequestFactory().get("/")
        self.assertEqual(course.get_duration_display(request), "1 week")

    def test_models_course_field_duration_default(self):
        """The duration field should default to None."""
        course = Course.objects.create(extended_object=PageFactory())
        self.assertIsNone(course.duration)

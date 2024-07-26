"""
Unit tests for the Course model
"""

# pylint: disable=too-many-lines
import functools
import random
from unittest import mock

from django.core.exceptions import ValidationError
from django.test import TestCase
from django.test.client import RequestFactory
from django.test.utils import override_settings
from django.utils import translation

from cms.api import add_plugin, create_page
from cms.models import PagePermission, Title
from filer.models import FolderPermission
from parler.utils.context import switch_language

from richie.apps.core.factories import PageFactory, TitleFactory
from richie.apps.courses import defaults, factories
from richie.apps.courses.cms_plugins import CoursePlugin
from richie.apps.courses.models import Course, CourseRun, CourseRunTranslation, Program
from richie.apps.courses.models.course import CourseRunCatalogVisibility

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
        course = factories.CourseFactory(extended_object=page)
        with self.assertNumQueries(2):
            self.assertEqual(str(course), "Course: Nano particles")

    def test_models_course_fields_code_unique_draft(self):
        """The `code` field should be unique among draft pages."""
        course = factories.CourseFactory(code="the-unique-code")

        # Creating a second course with the same code should raise an error...
        with self.assertRaises(ValidationError) as context:
            factories.CourseFactory(code="the-unique-code")

        self.assertEqual(
            context.exception.messages[0], "A course already exists with this code."
        )
        self.assertEqual(Course.objects.filter(code="THE-UNIQUE-CODE").count(), 1)

        # ... but the page extension can exist in draft and published versions
        course.extended_object.publish("en")
        self.assertEqual(Course.objects.filter(code="THE-UNIQUE-CODE").count(), 2)

    def test_models_course_fields_code_unique_public_self(self):
        """The `code` field should be unique among public pages."""
        course1 = factories.CourseFactory(code="the-old-code", should_publish=True)
        course2 = factories.CourseFactory(code="the-new-code", should_publish=True)

        course2.code = "another-code"
        course2.save()

        # The draft course1 can now be set to the new code
        course1.code = "the-new-code"
        course1.save()

        # But it should fail if we try to publish course1 while the public course2
        # still carries this code
        with self.assertRaises(ValidationError) as context:
            course1.extended_object.publish("en")

        self.assertEqual(
            context.exception.messages[0], "A course already exists with this code."
        )
        self.assertEqual(Course.objects.filter(code="THE-NEW-CODE").count(), 2)
        self.assertEqual(
            Course.objects.filter(
                extended_object__publisher_is_draft=False, code="THE-OLD-CODE"
            ).count(),
            1,
        )
        self.assertEqual(
            Course.objects.filter(
                extended_object__publisher_is_draft=True, code="ANOTHER-CODE"
            ).count(),
            1,
        )

    def test_models_course_fields_code_unique_public_other(self):
        """
        The code field can be repeated from a draft course to its public counterpart
        or snapshot.
        """
        course = factories.CourseFactory(code="123", should_publish=True)
        snapshot = factories.CourseFactory(
            code="123", page_parent=course.extended_object, should_publish=True
        )

        self.assertEqual(course.code, "123")
        self.assertEqual(course.public_extension.code, "123")
        self.assertEqual(snapshot.code, "123")
        self.assertEqual(snapshot.public_extension.code, "123")

    # get_es_id
    def test_get_es_id_for_draft_course_with_public_extension(self):
        """
        A draft course with a public extension. Its ES ID is the ID of the page linked to the
        public extension.
        """
        course = factories.CourseFactory(should_publish=True)
        self.assertEqual(
            course.get_es_id(), str(course.public_extension.extended_object_id)
        )

    def test_get_es_id_for_published_course(self):
        """
        A published course. Its ES ID is the ID of the page linked to it.
        """
        course = factories.CourseFactory(should_publish=True)
        self.assertEqual(
            course.public_extension.get_es_id(),
            str(course.public_extension.extended_object_id),
        )

    def test_get_es_id_for_draft_course_with_no_public_extension(self):
        """
        A draft course with no public extension. It has no ES ID.
        """
        course = factories.CourseFactory()
        self.assertEqual(course.get_es_id(), None)

    def test_models_course_create_page_role(self, *_):
        """
        If the CMS_PERMISSIONS settings is True, a page role should be created when calling
        `create_page_role` on a course.
        Calling the method several times should not duplicate permissions.
        """

        def get_random_role_dict():
            return {
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
        course = factories.CourseFactory(extended_object=page)
        self.assertFalse(page.roles.exists())

        role_dict = get_random_role_dict()
        with mock.patch.dict(defaults.COURSE_ADMIN_ROLE, role_dict):
            course.create_page_role()

        # Call the method another time with different permissions to check it has no effect
        with mock.patch.dict(defaults.COURSE_ADMIN_ROLE, get_random_role_dict()):
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
        course = factories.CourseFactory()
        self.assertIsNone(course.create_page_role())
        self.assertFalse(course.extended_object.roles.exists())

    def test_models_course_create_page_role_public_page(self, *_):
        """
        A page role should not be created for the public version of a course.
        """
        course = factories.CourseFactory(should_publish=True).public_extension
        self.assertIsNone(course.create_page_role())
        self.assertFalse(course.extended_object.roles.exists())

    def test_models_course_create_permissions_for_organization(self, *_):
        """
        If the CMS_PERMISSIONS settings is True, a page and folder permission should be created
        for the course when calling the `create_permissions_for_organization` method.
        Calling the method several times should not duplicate permissions.
        """

        def get_random_role_dict():
            return {
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

        course = factories.CourseFactory()
        factories.PageRoleFactory(page=course.extended_object, role="ADMIN")

        organization = factories.OrganizationFactory()
        organization_role = factories.PageRoleFactory(
            page=organization.extended_object, role="ADMIN"
        )

        role_dict = get_random_role_dict()
        with mock.patch.dict(defaults.ORGANIZATION_ADMIN_ROLE, role_dict):
            course.create_permissions_for_organization(organization)

        # Call the method another time with different permissions to check it has no effect
        with mock.patch.dict(defaults.ORGANIZATION_ADMIN_ROLE, get_random_role_dict()):
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
        course = factories.CourseFactory()
        organization = factories.OrganizationFactory()
        self.assertIsNone(course.create_permissions_for_organization(organization))
        self.assertFalse(PagePermission.objects.exists())
        self.assertFalse(FolderPermission.objects.exists())

    def test_models_course_create_permissions_for_organization_public_page(self, *_):
        """No permissions should be created for the public version of an course."""
        course = factories.CourseFactory(should_publish=True).public_extension
        organization = factories.OrganizationFactory(
            should_publish=True
        ).public_extension
        self.assertIsNone(course.create_permissions_for_organization(organization))
        self.assertFalse(PagePermission.objects.exists())
        self.assertFalse(FolderPermission.objects.exists())

    def test_models_course_get_categories_empty(self):
        """
        For a course not linked to any category the method `get_categories` should
        return an empty query.
        """
        course = factories.CourseFactory(should_publish=True)
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
        *draft_categories, _other_draft = factories.CategoryFactory.create_batch(3)
        *published_categories, _other_public = factories.CategoryFactory.create_batch(
            3, should_publish=True
        )
        course = factories.CourseFactory(
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
        category_fr = factories.CategoryFactory(page_languages=["fr"])
        category_en = factories.CategoryFactory(page_languages=["en"])

        course = factories.CourseFactory(should_publish=True)
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

    @override_settings(
        LANGUAGES=(("en", "en"), ("fr", "fr"), ("de", "de")),
        CMS_LANGUAGES={
            "default": {
                "public": True,
                "hide_untranslated": False,
                "redirect_on_fallback": False,
                "fallbacks": ["en", "fr", "de"],
            }
        },
    )
    def test_models_course_get_categories_language_fallback(self):
        """
        The `get_categories` method should return categories linked to a course by
        a plugin in fallback language by order of falling back.
        """
        category1, category2, category3 = factories.CategoryFactory.create_batch(
            3, should_publish=True
        )
        course = factories.CourseFactory(should_publish=True)
        placeholder = course.extended_object.placeholders.get(slot="course_team")

        # Plugin lookups should fallback up to the second priority language
        add_plugin(
            language="de",
            placeholder=placeholder,
            plugin_type="CategoryPlugin",
            **{"page": category1.extended_object},
        )
        with translation.override("en"):
            self.assertEqual(list(course.get_categories()), [category1])

        with translation.override("fr"):
            self.assertEqual(list(course.get_categories()), [category1])

        with translation.override("de"):
            self.assertEqual(list(course.get_categories()), [category1])

        # Plugin lookups should fallback to the first priority language if available
        # and ignore the second priority language unless it is the current language
        add_plugin(
            language="fr",
            placeholder=placeholder,
            plugin_type="CategoryPlugin",
            **{"page": category2.extended_object},
        )
        with translation.override("en"):
            self.assertEqual(list(course.get_categories()), [category2])

        with translation.override("fr"):
            self.assertEqual(list(course.get_categories()), [category2])

        with translation.override("de"):
            self.assertEqual(list(course.get_categories()), [category1])

        # Reverse plugin lookups should stick to the current language if available and
        # ignore plugins on fallback languages
        add_plugin(
            language="en",
            placeholder=placeholder,
            plugin_type="CategoryPlugin",
            **{"page": category3.extended_object},
        )
        with translation.override("en"):
            self.assertEqual(list(course.get_categories()), [category3])

        with translation.override("fr"):
            self.assertEqual(list(course.get_categories()), [category2])

        with translation.override("de"):
            self.assertEqual(list(course.get_categories()), [category1])

    def test_models_course_get_categories_other_placeholders(self):
        """
        The `get_categories` method should return all categories linked to a course via a plugin
        on whichever placeholder.
        """
        category1, category2 = factories.CategoryFactory.create_batch(2)

        course = factories.CourseFactory(should_publish=True)
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
        course = factories.CourseFactory(should_publish=True)
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
        *draft_organizations, _other_draft = factories.OrganizationFactory.create_batch(
            3
        )
        (
            *published_organizations,
            _other_public,
        ) = factories.OrganizationFactory.create_batch(3, should_publish=True)
        course = factories.CourseFactory(
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

    def test_models_course_get_organizations_language_current(self):
        """
        The `get_organizations` method should only return organizations linked to a course by
        a plugin in the current language.
        """
        organization_fr = factories.OrganizationFactory(page_languages=["fr"])
        organization_en = factories.OrganizationFactory(page_languages=["en"])

        course = factories.CourseFactory(should_publish=True)
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

    @override_settings(
        LANGUAGES=(("en", "en"), ("fr", "fr"), ("de", "de")),
        CMS_LANGUAGES={
            "default": {
                "public": True,
                "hide_untranslated": False,
                "redirect_on_fallback": False,
                "fallbacks": ["en", "fr", "de"],
            }
        },
    )
    def test_models_course_get_organizations_language_fallback(self):
        """
        The `get_organizations` method should return organizations linked to a course by
        a plugin in fallback language by order of falling back.
        """
        (
            organization1,
            organization2,
            organization3,
        ) = factories.OrganizationFactory.create_batch(3, should_publish=True)
        course = factories.CourseFactory(should_publish=True)
        placeholder = course.extended_object.placeholders.get(
            slot="course_organizations"
        )

        # Plugin lookups should fallback up to the second priority language
        add_plugin(
            language="de",
            placeholder=placeholder,
            plugin_type="OrganizationPlugin",
            **{"page": organization1.extended_object},
        )
        with translation.override("en"):
            self.assertEqual(list(course.get_organizations()), [organization1])

        with translation.override("fr"):
            self.assertEqual(list(course.get_organizations()), [organization1])

        with translation.override("de"):
            self.assertEqual(list(course.get_organizations()), [organization1])

        # Plugin lookups should fallback to the first priority language if available
        # and ignore the second priority language unless it is the current language
        add_plugin(
            language="fr",
            placeholder=placeholder,
            plugin_type="OrganizationPlugin",
            **{"page": organization2.extended_object},
        )
        with translation.override("en"):
            self.assertEqual(list(course.get_organizations()), [organization2])

        with translation.override("fr"):
            self.assertEqual(list(course.get_organizations()), [organization2])

        with translation.override("de"):
            self.assertEqual(list(course.get_organizations()), [organization1])

        # Reverse plugin lookups should stick to the current language if available and
        # ignore plugins on fallback languages
        add_plugin(
            language="en",
            placeholder=placeholder,
            plugin_type="OrganizationPlugin",
            **{"page": organization3.extended_object},
        )
        with translation.override("en"):
            self.assertEqual(list(course.get_organizations()), [organization3])

        with translation.override("fr"):
            self.assertEqual(list(course.get_organizations()), [organization2])

        with translation.override("de"):
            self.assertEqual(list(course.get_organizations()), [organization1])

    def test_models_course_get_organizations_other_placeholders(self):
        """
        The `get_organizations` method should return all organizations linked to a course via a
        plugin on whichever placeholder.
        """
        organization1, organization2 = factories.OrganizationFactory.create_batch(2)

        course = factories.CourseFactory(should_publish=True)
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
        course = factories.CourseFactory(should_publish=True)
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
        *draft_organizations, _other_draft = factories.OrganizationFactory.create_batch(
            3
        )
        (
            *published_organizations,
            _other_public,
        ) = factories.OrganizationFactory.create_batch(3, should_publish=True)

        # Shuffle all organizations to make sure their order in the placeholder is what
        # determines which one is the main organization
        all_organizations = draft_organizations + published_organizations
        random.shuffle(all_organizations)

        course = factories.CourseFactory(
            fill_organizations=all_organizations, should_publish=True
        )

        self.assertEqual(course.get_main_organization(), all_organizations[0])
        self.assertEqual(
            course.public_extension.get_main_organization(),
            # Find the first published organization in this list of organizations
            next(o for o in all_organizations if o in published_organizations),
        )

    def test_models_course_get_persons_empty(self):
        """
        For a course not linked to any person the method `get_persons` should
        return an empty query.
        """
        course = factories.CourseFactory(should_publish=True)
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
        *draft_persons, _other_draft = factories.PersonFactory.create_batch(3)
        *published_persons, _other_public = factories.PersonFactory.create_batch(
            3, should_publish=True
        )
        course = factories.CourseFactory(
            fill_team=draft_persons + published_persons, should_publish=True
        )

        self.assertEqual(list(course.get_persons()), draft_persons + published_persons)
        self.assertEqual(list(course.public_extension.get_persons()), published_persons)

    def test_models_course_get_persons_language(self):
        """
        The `get_persons` method should only return persons linked to a course by a plugin
        in the current language.
        """
        person_fr = factories.PersonFactory(page_languages=["fr"])
        person_en = factories.PersonFactory(page_languages=["en"])

        course = factories.CourseFactory(should_publish=True)
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

    @override_settings(
        LANGUAGES=(("en", "en"), ("fr", "fr"), ("de", "de")),
        CMS_LANGUAGES={
            "default": {
                "public": True,
                "hide_untranslated": False,
                "redirect_on_fallback": False,
                "fallbacks": ["en", "fr", "de"],
            }
        },
    )
    def test_models_course_get_persons_language_fallback(self):
        """
        The `get_persons` method should return persons linked to a course by
        a plugin in fallback language by order of falling back.
        """
        person1, person2, person3 = factories.PersonFactory.create_batch(
            3, should_publish=True
        )
        course = factories.CourseFactory(should_publish=True)
        placeholder = course.extended_object.placeholders.get(slot="course_team")

        # Plugin lookups should fallback up to the second priority language
        add_plugin(
            language="de",
            placeholder=placeholder,
            plugin_type="PersonPlugin",
            **{"page": person1.extended_object},
        )
        with translation.override("en"):
            self.assertEqual(list(course.get_persons()), [person1])

        with translation.override("fr"):
            self.assertEqual(list(course.get_persons()), [person1])

        with translation.override("de"):
            self.assertEqual(list(course.get_persons()), [person1])

        # Plugin lookups should fallback to the first priority language if available
        # and ignore the second priority language unless it is the current language
        add_plugin(
            language="fr",
            placeholder=placeholder,
            plugin_type="PersonPlugin",
            **{"page": person2.extended_object},
        )
        with translation.override("en"):
            self.assertEqual(list(course.get_persons()), [person2])

        with translation.override("fr"):
            self.assertEqual(list(course.get_persons()), [person2])

        with translation.override("de"):
            self.assertEqual(list(course.get_persons()), [person1])

        # Reverse plugin lookups should stick to the current language if available and
        # ignore plugins on fallback languages
        add_plugin(
            language="en",
            placeholder=placeholder,
            plugin_type="PersonPlugin",
            **{"page": person3.extended_object},
        )
        with translation.override("en"):
            self.assertEqual(list(course.get_persons()), [person3])

        with translation.override("fr"):
            self.assertEqual(list(course.get_persons()), [person2])

        with translation.override("de"):
            self.assertEqual(list(course.get_persons()), [person1])

    def test_models_course_get_persons_other_placeholders(self):
        """
        The `get_persons` method should return all persons linked to a course via a plugin
        on whichever placeholder.
        """
        person1, person2 = factories.PersonFactory.create_batch(2)

        course = factories.CourseFactory(should_publish=True)
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
        For a course without course runs the methods `course_runs` should
        return an empty query.
        """
        course = factories.CourseFactory(should_publish=True)
        self.assertFalse(course.course_runs.exists())
        self.assertFalse(course.public_extension.course_runs.exists())

    def test_models_course_get_course_runs(self):
        """
        The `get_course_runs` method should return all descendants ranked by start date,
        not only direct children.
        """
        course = factories.CourseFactory(page_languages=["en", "fr"])

        # Create draft and published course runs for this course
        course_run = factories.CourseRunFactory(direct_course=course)

        self.assertTrue(course.extended_object.publish("en"))
        self.assertTrue(course.extended_object.publish("fr"))

        course_run_draft = factories.CourseRunFactory(direct_course=course)

        # Create a child course with draft and published course runs (what results from
        # snapshotting a course)
        child_course = factories.CourseFactory(
            page_languages=["en", "fr"], page_parent=course.extended_object
        )
        child_course_run = factories.CourseRunFactory(direct_course=child_course)

        self.assertTrue(child_course.extended_object.publish("en"))
        self.assertTrue(child_course.extended_object.publish("fr"))

        child_course_run_draft = factories.CourseRunFactory(direct_course=child_course)

        # Create another course, not related to the first one, with draft and published course runs
        other_course = factories.CourseFactory(page_languages=["en", "fr"])
        factories.CourseRunFactory(direct_course=other_course)

        self.assertTrue(other_course.extended_object.publish("en"))
        self.assertTrue(other_course.extended_object.publish("fr"))

        factories.CourseRunFactory(direct_course=other_course)

        # Check that the draft course retrieves all its descendant course runs
        # 3 draft course runs and 2 published course runs per course
        self.assertEqual(CourseRun.objects.count(), 3 * 3)

        sorted_runs = sorted(
            [course_run, course_run_draft, child_course_run, child_course_run_draft],
            key=lambda o: o.start,
            reverse=True,
        )
        for run in sorted_runs:
            run.refresh_from_db()

        with self.assertNumQueries(2):
            self.assertEqual(list(course.course_runs), sorted_runs)

        # Check that the published course retrieves only the published descendant course runs
        course.refresh_from_db()
        public_course = course.public_extension

        with self.assertNumQueries(3):
            result = list(public_course.course_runs)

        expected_public_course_runs = sorted(
            [course_run.public_course_run, child_course_run.public_course_run],
            key=lambda o: o.start,
            reverse=True,
        )
        self.assertEqual(result, expected_public_course_runs)

    def test_models_course_course_runs_enrollment_count(self):
        """
        The `course_runs_enrollment_count` property should be computed only once per request.
        """
        course = factories.CourseFactory()

        # Create random course runs for this course
        factories.CourseRunFactory(enrollment_count=3, direct_course=course)
        factories.CourseRunFactory(enrollment_count=2, direct_course=course)
        course.extended_object.publish("en")
        course.refresh_from_db()

        with self.assertNumQueries(4):
            enrollment_count_sum = course.public_extension.course_runs_enrollment_count
            self.assertEqual(enrollment_count_sum, 5)

        # Check that getting the dict a second time gets it from the instance cache
        with self.assertNumQueries(0):
            enrollment_count_sum = course.public_extension.course_runs_enrollment_count
            self.assertEqual(enrollment_count_sum, 5)

    def test_models_course_course_runs_enrollment_count_hidden_run(self):
        """
        The `course_runs_enrollment_count` property should not include the hidden course runs.
        """
        course = factories.CourseFactory()

        # Create random course runs for this course
        factories.CourseRunFactory(enrollment_count=30, direct_course=course)
        factories.CourseRunFactory(enrollment_count=20, direct_course=course)
        factories.CourseRunFactory(
            enrollment_count=10,
            direct_course=course,
            catalog_visibility=CourseRunCatalogVisibility.HIDDEN,
        )
        course.extended_object.publish("en")
        course.refresh_from_db()

        enrollment_count_sum = course.public_extension.course_runs_enrollment_count
        self.assertEqual(enrollment_count_sum, 50)

    def test_models_course_course_runs_dict(self):
        """The `course_runs_dict` property should be computed on once per request."""
        course = factories.CourseFactory()

        # Create random course runs for this course
        factories.CourseRunFactory.create_batch(3, direct_course=course)
        course.extended_object.publish("en")
        course.refresh_from_db()

        with self.assertNumQueries(4):
            runs_dict = course.public_extension.course_runs_dict
        self.assertEqual(
            functools.reduce(lambda x, k: x + len(runs_dict[k]), runs_dict, 0), 3
        )

        # Check that getting the dict a second time gets it from the instance cache
        with self.assertNumQueries(0):
            runs_dict = course.public_extension.course_runs_dict

        self.assertEqual(
            functools.reduce(lambda x, k: x + len(runs_dict[k]), runs_dict, 0), 3
        )

    def test_models_course_get_programs(self):
        """
        It should be possible to retrieve the list of related programs on the course instance.
        The number of queries should be minimal.
        """
        course = factories.CourseFactory(should_publish=True)
        programs = factories.ProgramFactory.create_batch(
            3, page_title="my title", fill_courses=[course], should_publish=True
        )
        retrieved_programs = course.get_programs()

        with self.assertNumQueries(2):
            self.assertEqual(set(retrieved_programs), set(programs))

        with self.assertNumQueries(0):
            for program in retrieved_programs:
                self.assertEqual(
                    program.extended_object.prefetched_titles[0].title, "my title"
                )

    def test_models_course_get_programs_language_fallback_draft(self):
        """
        Validate that the reverse programs lookup works as expected with language fallback
        on a draft page.
        """
        course1, course2, course3 = factories.CourseFactory.create_batch(
            3, should_publish=True
        )
        program = factories.ProgramFactory(should_publish=True)
        placeholder = program.extended_object.placeholders.get(slot="program_courses")
        cms_languages = {
            "default": {
                "public": True,
                "hide_untranslated": False,
                "redirect_on_fallback": False,
                "fallbacks": ["en", "fr", "de"],
            }
        }

        # Reverse plugin lookups should fallback up to the second priority language
        add_plugin(
            language="de",
            placeholder=placeholder,
            plugin_type="CoursePlugin",
            **{"page": course1.extended_object},
        )
        with override_settings(CMS_LANGUAGES=cms_languages):
            with translation.override("en"):
                self.assertEqual(list(course1.get_programs()), [program])
                self.assertEqual(list(course2.get_programs()), [])
                self.assertEqual(list(course3.get_programs()), [])

            with translation.override("fr"):
                self.assertEqual(list(course1.get_programs()), [program])
                self.assertEqual(list(course2.get_programs()), [])
                self.assertEqual(list(course3.get_programs()), [])

            with translation.override("de"):
                self.assertEqual(list(course1.get_programs()), [program])
                self.assertEqual(list(course2.get_programs()), [])
                self.assertEqual(list(course3.get_programs()), [])

        # Reverse plugin lookups should fallback to the first priority language if available
        # and ignore the second priority language unless it is the current language
        add_plugin(
            language="fr",
            placeholder=placeholder,
            plugin_type="CoursePlugin",
            **{"page": course2.extended_object},
        )
        with override_settings(CMS_LANGUAGES=cms_languages):
            with translation.override("en"):
                self.assertEqual(list(course1.get_programs()), [])
                self.assertEqual(list(course2.get_programs()), [program])
                self.assertEqual(list(course3.get_programs()), [])

            with translation.override("fr"):
                self.assertEqual(list(course1.get_programs()), [])
                self.assertEqual(list(course2.get_programs()), [program])
                self.assertEqual(list(course3.get_programs()), [])

            with translation.override("de"):
                self.assertEqual(list(course1.get_programs()), [program])
                self.assertEqual(list(course2.get_programs()), [])
                self.assertEqual(list(course3.get_programs()), [])

        # Reverse plugin lookups should stick to the current language if available and
        # ignore plugins on fallback languages
        add_plugin(
            language="en",
            placeholder=placeholder,
            plugin_type="CoursePlugin",
            **{"page": course3.extended_object},
        )
        with override_settings(CMS_LANGUAGES=cms_languages):
            with translation.override("en"):
                self.assertEqual(list(course1.get_programs()), [])
                self.assertEqual(list(course2.get_programs()), [])
                self.assertEqual(list(course3.get_programs()), [program])

            with translation.override("fr"):
                self.assertEqual(list(course1.get_programs()), [])
                self.assertEqual(list(course2.get_programs()), [program])
                self.assertEqual(list(course3.get_programs()), [])

            with translation.override("de"):
                self.assertEqual(list(course1.get_programs()), [program])
                self.assertEqual(list(course2.get_programs()), [])
                self.assertEqual(list(course3.get_programs()), [])

    @override_settings(
        LANGUAGES=(("en", "en"), ("fr", "fr"), ("de", "de")),
        CMS_LANGUAGES={
            "default": {
                "public": True,
                "hide_untranslated": False,
                "redirect_on_fallback": False,
                "fallbacks": ["en", "fr", "de"],
            }
        },
    )
    # pylint: disable=too-many-statements
    def test_models_course_get_programs_language_fallback_published(self):
        """
        Validate that the reverse programs lookup works as expected with language fallback
        on a published page.
        """
        course1, course2, course3 = factories.CourseFactory.create_batch(
            3, should_publish=True
        )
        public_course1 = course1.public_extension
        public_course2 = course2.public_extension
        public_course3 = course3.public_extension

        program, program_unpublished = factories.ProgramFactory.create_batch(
            2, page_languages=["en", "fr", "de"], should_publish=True
        )

        public_program = program.public_extension

        public_program_unpublished = program_unpublished.public_extension
        program_unpublished.extended_object.unpublish("en")
        program_unpublished.extended_object.unpublish("fr")
        program_unpublished.extended_object.unpublish("de")

        placeholder = public_program.extended_object.placeholders.get(
            slot="program_courses"
        )
        placeholder_unpublished = (
            public_program_unpublished.extended_object.placeholders.get(
                slot="program_courses"
            )
        )
        # Reverse plugin lookups should fallback up to the second priority language
        add_plugin(
            language="de",
            placeholder=placeholder,
            plugin_type="CoursePlugin",
            **{"page": course1.extended_object},
        )
        add_plugin(
            language="de",
            placeholder=placeholder_unpublished,
            plugin_type="CoursePlugin",
            **{"page": course1.extended_object},
        )

        with translation.override("en"):
            self.assertEqual(list(public_course1.get_programs()), [public_program])
            self.assertEqual(list(public_course2.get_programs()), [])
            self.assertEqual(list(public_course3.get_programs()), [])

        with translation.override("fr"):
            self.assertEqual(list(public_course1.get_programs()), [public_program])
            self.assertEqual(list(public_course2.get_programs()), [])
            self.assertEqual(list(public_course3.get_programs()), [])

        with translation.override("de"):
            self.assertEqual(list(public_course1.get_programs()), [public_program])
            self.assertEqual(list(public_course2.get_programs()), [])
            self.assertEqual(list(public_course3.get_programs()), [])

        # Reverse plugin lookups should fallback to the first priority language if available
        # and ignore the second priority language unless it is the current language
        add_plugin(
            language="fr",
            placeholder=placeholder,
            plugin_type="CoursePlugin",
            **{"page": course2.extended_object},
        )
        add_plugin(
            language="fr",
            placeholder=placeholder_unpublished,
            plugin_type="CoursePlugin",
            **{"page": course2.extended_object},
        )
        with translation.override("en"):
            self.assertEqual(list(public_course1.get_programs()), [])
            self.assertEqual(list(public_course2.get_programs()), [public_program])
            self.assertEqual(list(public_course3.get_programs()), [])

        with translation.override("fr"):
            self.assertEqual(list(public_course1.get_programs()), [])
            self.assertEqual(list(public_course2.get_programs()), [public_program])
            self.assertEqual(list(public_course3.get_programs()), [])

        with translation.override("de"):
            self.assertEqual(list(public_course1.get_programs()), [public_program])
            self.assertEqual(list(public_course2.get_programs()), [])
            self.assertEqual(list(public_course3.get_programs()), [])

        # Reverse plugin lookups should stick to the current language if available and
        # ignore plugins on fallback languages
        add_plugin(
            language="en",
            placeholder=placeholder,
            plugin_type="CoursePlugin",
            **{"page": course3.extended_object},
        )
        add_plugin(
            language="en",
            placeholder=placeholder_unpublished,
            plugin_type="CoursePlugin",
            **{"page": course3.extended_object},
        )
        with translation.override("en"):
            self.assertEqual(list(public_course1.get_programs()), [])
            self.assertEqual(list(public_course2.get_programs()), [])
            self.assertEqual(list(public_course3.get_programs()), [public_program])

        with translation.override("fr"):
            self.assertEqual(list(public_course1.get_programs()), [])
            self.assertEqual(list(public_course2.get_programs()), [public_program])
            self.assertEqual(list(public_course3.get_programs()), [])

        with translation.override("de"):
            self.assertEqual(list(public_course1.get_programs()), [public_program])
            self.assertEqual(list(public_course2.get_programs()), [])
            self.assertEqual(list(public_course3.get_programs()), [])

    def test_models_course_get_programs_public_course_page(self):
        """
        When a course is added on a draft program, the program should not be visible on
        the public course page until the program is published.
        """
        course = factories.CourseFactory(should_publish=True)
        course_page = course.extended_object
        program = factories.ProgramFactory(page_title="my title", should_publish=True)
        program_page = program.extended_object

        # Add a course to the program but don't publish the modification
        placeholder = program_page.placeholders.get(slot="program_courses")
        add_plugin(placeholder, CoursePlugin, "en", page=course_page)

        self.assertEqual(list(course.get_programs()), [program])
        self.assertEqual(list(course.public_extension.get_programs()), [])

        # Now publish the modification and check that the program is displayed
        # on the public course page
        program.extended_object.publish("en")
        self.assertEqual(
            list(course.public_extension.get_programs()), [program.public_extension]
        )

        # If the program is unpublished, it should not be displayed on the public
        # page anymore
        program_page.unpublish("en")
        self.assertEqual(list(course.get_programs()), [program])
        self.assertEqual(list(course.public_extension.get_programs()), [])

    def test_models_course_get_programs_several_languages(self):
        """
        The programs should not be duplicated if they exist in several languages.
        """
        course = factories.CourseFactory(should_publish=True)
        factories.ProgramFactory(
            page_title={"en": "my title", "fr": "mon titre"},
            fill_courses=[course],
            should_publish=True,
        )
        self.assertEqual(Program.objects.count(), 2)
        self.assertEqual(course.get_programs().count(), 1)

    def test_models_course_get_root_to_leaf_public_category_pages_leaf(self):
        """
        A course linked to a leaf category, in a nested category tree, should be associated
        with all the category's ancestors.
        """
        # Create nested categories
        create_page("Categories", "richie/single_column.html", "en")
        meta_category = factories.CategoryFactory(should_publish=True)
        parent_category = factories.CategoryFactory(
            page_parent=meta_category.extended_object, should_publish=True
        )
        leaf_category = factories.CategoryFactory(
            page_parent=parent_category.extended_object, should_publish=True
        )

        course = factories.CourseFactory(
            fill_categories=[leaf_category], should_publish=True
        )

        expected_pages = [
            parent_category.public_extension.extended_object,
            leaf_category.public_extension.extended_object,
        ]
        self.assertEqual(
            expected_pages, list(course.get_root_to_leaf_public_category_pages())
        )

    def test_models_course_get_root_to_leaf_public_category_pages_parent(self):
        """
        A course linked to a parent category, in a nested category tree, should be associated
        with all the category's ancestors, but not we the child.
        """
        # Create nested categories
        create_page("Categories", "richie/single_column.html", "en")
        meta_category = factories.CategoryFactory(should_publish=True)
        parent_category = factories.CategoryFactory(
            page_parent=meta_category.extended_object, should_publish=True
        )
        factories.CategoryFactory(
            page_parent=parent_category.extended_object, should_publish=True
        )

        course = factories.CourseFactory(
            fill_categories=[parent_category], should_publish=True
        )

        expected_pages = [parent_category.public_extension.extended_object]
        self.assertEqual(
            expected_pages, list(course.get_root_to_leaf_public_category_pages())
        )

    def test_models_course_get_root_to_leaf_public_category_pages_duplicate(self):
        """
        If the course is linked to several categories, the ancestor categories should not get
        duplicated.
        """
        # Create nested categories
        create_page("Categories", "richie/single_column.html", "en")
        meta_category = factories.CategoryFactory(should_publish=True)
        parent_category = factories.CategoryFactory(
            page_parent=meta_category.extended_object, should_publish=True
        )
        leaf_category1 = factories.CategoryFactory(
            page_parent=parent_category.extended_object, should_publish=True
        )
        leaf_category2 = factories.CategoryFactory(
            page_parent=parent_category.extended_object, should_publish=True
        )

        course = factories.CourseFactory(
            fill_categories=[leaf_category1, leaf_category2], should_publish=True
        )

        expected_pages = [
            parent_category.public_extension.extended_object,
            leaf_category1.public_extension.extended_object,
            leaf_category2.public_extension.extended_object,
        ]
        self.assertEqual(
            expected_pages, list(course.get_root_to_leaf_public_category_pages())
        )

    # Fields: effort

    def test_models_course_field_effort_null(self):
        """The effort field can be null."""
        course = factories.CourseFactory(effort=None)
        self.assertIsNone(course.effort)
        self.assertEqual(course.get_effort_display(), "")

    def test_models_course_field_effort_invalid(self):
        """An effort should be a pair: number, time unit."""
        with self.assertRaises(ValidationError) as context:
            factories.CourseFactory(effort=[5])
        self.assertEqual(
            context.exception.messages[0],
            "A composite duration should be a pair: number and time unit.",
        )

    def test_models_course_field_effort_integer(self):
        """The first value of the effort pair should be an integer."""
        for value in ["a", "1.0"]:
            with self.assertRaises(ValidationError) as context:
                factories.CourseFactory(effort=[value, "hour"])
            self.assertEqual(
                context.exception.messages[0],
                "A composite duration should be a round number of time units.",
            )

    def test_models_course_field_effort_positive(self):
        """The first value should be a positive integer."""
        with self.assertRaises(ValidationError) as context:
            factories.CourseFactory(effort=[-1, "hour"])
        self.assertEqual(
            context.exception.messages[0], "A composite duration should be positive."
        )

    def test_models_course_field_effort_invalid_unit(self):
        """The second value should be a valid time unit choice."""
        with self.assertRaises(ValidationError) as context:
            factories.CourseFactory(effort=[1, "invalid"])
        self.assertEqual(
            context.exception.messages[0],
            "invalid is not a valid choice for a time unit.",
        )

    def test_models_course_field_effort_display_singular(self):
        """Validate that a value of 1 time unit is displayed as expected."""
        course = factories.CourseFactory(effort=[1, "hour"])
        self.assertEqual(course.get_effort_display(), "1 hour")

    def test_models_course_field_effort_display_plural(self):
        """Validate that a plural number of time units is displayed as expected."""
        course = factories.CourseFactory(effort=[2, "hour"])
        self.assertEqual(course.get_effort_display(), "2 hours")

    def test_models_course_field_effort_display_request(self):
        """
        When used in the `render_model` template tag, it should not break when passed a
        request argument (the DjangoCMS frontend editing does it).
        """
        course = factories.CourseFactory(effort=[1, "hour"])
        request = RequestFactory().get("/")
        self.assertEqual(course.get_effort_display(request), "1 hour")

    def test_models_course_field_effort_default(self):
        """The effort field should default to None."""
        course = Course.objects.create(extended_object=PageFactory())
        self.assertIsNone(course.effort)

    def test_models_course_field_pt_effort_null(self):
        """The "pt_effort" property should return an empty string if effort is not set"""
        course = factories.CourseFactory(effort=None)
        self.assertEqual(course.pt_effort, "")

    def test_models_course_field_pt_effort_1_hour(self):
        """The "pt_effort" property should return what schema.org metadata expects"""
        course = factories.CourseFactory(effort=[1, "hour"])
        self.assertEqual(course.pt_effort, "PT1H")

    def test_models_course_field_pt_effort_20_minute(self):
        """The "pt_effort" property should return what schema.org metadata expects"""
        course = factories.CourseFactory(effort=[20, "minute"])
        self.assertEqual(course.pt_effort, "PT20M")

    # Fields: duration

    def test_models_course_field_duration_null(self):
        """The duration field can be null."""
        course = factories.CourseFactory(duration=None)
        self.assertIsNone(course.duration)
        self.assertEqual(course.get_duration_display(), "")

    def test_models_course_field_duration_invalid(self):
        """The duration should be a pair: number and unit."""
        with self.assertRaises(ValidationError) as context:
            factories.CourseFactory(duration=5)
        self.assertEqual(
            context.exception.messages[0],
            "A composite duration should be a pair: number and time unit.",
        )

    def test_models_course_field_duration_integer(self):
        """The first value of the duration pair should be an integer."""
        for value in ["a", "1.0"]:
            with self.assertRaises(ValidationError) as context:
                factories.CourseFactory(duration=[value, "minute"])
            self.assertEqual(
                context.exception.messages[0],
                "A composite duration should be a round number of time units.",
            )

    def test_models_course_field_duration_positive(self):
        """The first value should be a positive integer."""
        with self.assertRaises(ValidationError) as context:
            factories.CourseFactory(duration=[-1, "day"])
        self.assertEqual(
            context.exception.messages[0], "A composite duration should be positive."
        )

    def test_models_course_field_duration_invalid_unit(self):
        """The second value should be a valid time unit choice."""
        with self.assertRaises(ValidationError) as context:
            factories.CourseFactory(duration=[1, "invalid"])
        self.assertEqual(
            context.exception.messages[0],
            "invalid is not a valid choice for a time unit.",
        )

    def test_models_course_field_duration_display_singular(self):
        """Validate that a value of 1 time unit is displayed as expected."""
        course = factories.CourseFactory(duration=[1, "day"])
        self.assertEqual(course.get_duration_display(), "1 day")

    def test_models_course_field_duration_display_plural(self):
        """Validate that a plural number of time units is displayed as expected."""
        course = factories.CourseFactory(duration=[2, "day"])
        self.assertEqual(course.get_duration_display(), "2 days")

    def test_models_course_field_duration_display_request(self):
        """
        When used in the `render_model` template tag, it should not break when passed a
        request argument (the DjangoCMS frontend editing does it).
        """
        course = factories.CourseFactory(duration=[1, "week"])
        request = RequestFactory().get("/")
        self.assertEqual(course.get_duration_display(request), "1 week")

    def test_models_course_field_duration_default(self):
        """The duration field should default to None."""
        course = Course.objects.create(extended_object=PageFactory())
        self.assertIsNone(course.duration)

    # Testing method "copy_relations"

    def test_models_course_copy_relations_publish(self):
        """
        When publishing a draft course, the draft course run should be copied to a newly created
        course run with its parler translations.

        In a second part of the test, we check that when publishing a course that was already
        published, the draft course run should be copied to the existing public course run with its
        parler translations.

        """
        # 1- Publishing a draft course

        course = factories.CourseFactory(page_title="my course title")
        TitleFactory(
            page=course.extended_object, language="fr", title="mon titre de cours"
        )
        course_run = factories.CourseRunFactory(direct_course=course, title="my run")
        CourseRunTranslation.objects.create(
            master=course_run, language_code="fr", title="ma session"
        )
        self.assertEqual(Course.objects.count(), 1)
        self.assertEqual(CourseRun.objects.count(), 1)
        self.assertEqual(CourseRunTranslation.objects.count(), 2)
        self.assertEqual(Title.objects.count(), 2)

        self.assertTrue(course.extended_object.publish("fr"))

        self.assertEqual(Course.objects.count(), 2)
        self.assertEqual(CourseRun.objects.count(), 2)
        self.assertEqual(CourseRunTranslation.objects.count(), 3)
        self.assertEqual(Title.objects.count(), 3)

        # 2- Publishing a course that was already published
        self.assertTrue(course.extended_object.publish("en"))

        self.assertEqual(CourseRunTranslation.objects.count(), 4)
        self.assertEqual(Title.objects.count(), 4)

        course_run.refresh_from_db()

        public_course_run = course_run.public_course_run
        self.assertEqual(public_course_run.title, "my run")
        with switch_language(public_course_run, "fr"):
            self.assertEqual(public_course_run.title, "ma session")

    def test_models_course_copy_relations_cloning(self):
        """When cloning a page, the course runs should not be copied."""
        course = factories.CourseFactory(page_title="my course title")
        page = course.extended_object
        TitleFactory(
            page=course.extended_object, language="fr", title="mon titre de cours"
        )
        course_run = factories.CourseRunFactory(direct_course=course, title="my run")
        CourseRunTranslation.objects.create(
            master=course_run, language_code="fr", title="ma session"
        )

        # Copy the course page as its own child
        copy_page = page.copy(
            page.node.site, parent_node=page.node, translations=True, extensions=True
        )

        self.assertEqual(Course.objects.count(), 2)
        self.assertEqual(CourseRun.objects.count(), 1)
        self.assertEqual(CourseRunTranslation.objects.count(), 2)
        self.assertEqual(Title.objects.count(), 4)

        self.assertIsNone(copy_page.course.runs.first())

    def test_models_course_copy_relations_publish_recursive_loop(self):
        """
        In a previous version of the the CourseRun method "copy_translations" in which we
        used instances instead of update queries, this test was generating an infinite
        recursive loop.
        """
        course = factories.CourseFactory(page_title="my course title")
        TitleFactory(
            page=course.extended_object, language="fr", title="mon titre de cours"
        )
        course_run = factories.CourseRunFactory(direct_course=course, title="my run")
        course_run_translation_fr = CourseRunTranslation.objects.create(
            master=course_run, language_code="fr", title="ma session"
        )
        self.assertTrue(course.extended_object.publish("fr"))

        course_run_translation_fr.title = "ma session modifiée"
        course_run_translation_fr.save()

        self.assertTrue(course.extended_object.publish("fr"))

    # Testing methods get_pace
    def test_models_course_get_pace_with_no_effort_and_duration(self):
        """
        get_pace should return None if duration and effort fields are empty.
        """
        course = factories.CourseFactory(
            duration=None, effort=None, is_self_paced=False
        )
        self.assertIsNone(course.get_pace())

    def test_models_course_get_pace_with_is_self_paced_enabled(self):
        """
        get_pace should return None if course is self paced.
        """
        course = factories.CourseFactory(
            duration=[5, "week"], effort=[2, "hour"], is_self_paced=True
        )
        self.assertIsNone(course.get_pace())

    def test_models_course_get_pace_with_empty_effort(self):
        """
        get_pace should raise a ValueError if effort is empty.
        """
        course = factories.CourseFactory(
            duration=[1, "hour"], effort=None, is_self_paced=False
        )

        with self.assertRaises(ValueError) as context:
            course.get_pace()

        self.assertEqual(str(context.exception), "Cannot compute pace without effort.")

    def test_models_course_get_pace_with_uncomputable_values(self):
        """
        get_pace should raise a ValueError if effort unit is less or equal then duration unit.
        """
        course = factories.CourseFactory(duration=[1, "hour"], effort=[1, "hour"])

        with self.assertRaises(ValueError) as context:
            course.get_pace()

        self.assertEqual(
            str(context.exception),
            "Cannot compute pace with effort unit less than or equal to the duration unit. "
            "(hour/hour)",
        )

    def test_models_course_get_pace(self):
        """
        Otherwise get_pace should return a triplet tuple (pace, pace_unit, pace_unit_reference)
        """
        course = factories.CourseFactory(duration=[7, "day"], effort=[7, "hour"])
        self.assertEqual(course.get_pace(), (1.0, "hour", "day"))

    # Testing methods get_pace_display
    def test_models_course_get_pace_display_with_full_hour_pace(self):
        """
        If pace is a full hour, hour label should be displayed
        """
        course = factories.CourseFactory(duration=[7, "day"], effort=[7, "hour"])
        self.assertEqual(course.get_pace_display(), "~1 hour/day")

    def test_models_course_get_pace_display_with_full_hour_pace_plural(self):
        """
        If pace is several full hours, plural hour label should be displayed
        """
        course = factories.CourseFactory(duration=[7, "day"], effort=[14, "hour"])
        self.assertEqual(course.get_pace_display(), "~2 hours/day")

    def test_models_course_get_pace_display_with_less_than_hour_pace(self):
        """
        If pace is less than an hour, plural minutes label should be displayed
        """
        course = factories.CourseFactory(duration=[7, "day"], effort=[70, "minute"])
        self.assertEqual(course.get_pace_display(), "~10 minutes/day")

    def test_models_course_get_pace_display_near_to_zero(self):
        """
        If pace is near to 0, at least a 5 minutes pace should be display.
        """
        course = factories.CourseFactory(
            duration=[7, "day"], effort=[10, "minute"], is_self_paced=False
        )
        self.assertEqual(course.get_pace_display(), "~5 minutes/day")

    def test_models_course_get_pace_display_with_less_than_hour_pace_rounded_by_fifteen(
        self,
    ):
        """
        If pace is less than an hour, plural minute label should be display and
        pace should be rounded by fifteen.
        """
        course = factories.CourseFactory(duration=[7, "day"], effort=[350, "minute"])
        self.assertEqual(course.get_pace_display(), "~45 minutes/day")

        course = factories.CourseFactory(duration=[7, "day"], effort=[4, "hour"])
        self.assertEqual(course.get_pace_display(), "~30 minutes/day")

    def test_models_course_get_pace_display_with_not_a_full_hour_pace(self):
        """
        If pace is not a full hour, a label with hour
        and minutes rounded by fifteen should be displayed.
        """
        course = factories.CourseFactory(duration=[7, "day"], effort=[23, "hour"])
        self.assertEqual(course.get_pace_display(), "~3h15/day")

    def test_models_course_get_pace_display_with_is_self_paced(self):
        """
        If course is self paced, a "Self paced" label should be display
        """
        course = factories.CourseFactory(is_self_paced=True)
        self.assertEqual(course.get_pace_display(), "Self paced")

    def test_models_course_get_pace_display_with_empty_effort(self):
        """
        If course effort is not defined, None should be return.
        """
        course = factories.CourseFactory(duration=[7, "hour"], effort=None)
        self.assertIsNone(course.get_pace_display())

    def test_models_course_get_pace_display_with_uncomputable_value(self):
        """
        If pace is uncomputable, None should be return.
        """
        course = factories.CourseFactory(duration=[7, "hour"], effort=[7, "hour"])
        self.assertIsNone(course.get_pace_display())

    def test_templates_course_runs_offers_dict_rdfa_fields(self):
        """
        Validates the fields of the generated rdfa dict
        """

        course: Course = factories.CourseFactory()

        for _ in range(1, 5):
            factories.CourseRunFactory(direct_course=course)

        info = course.generate_course_runs_offers_dict_rdfa()

        self.assertTrue(isinstance(info, dict))
        self.assertTrue(isinstance(info["offers"], list))

        for offer in info["offers"]:
            self.assertTrue(isinstance(offer, dict))
            self.assertTrue(isinstance(offer["@type"], str))
            self.assertTrue(isinstance(offer["category"], str))
            self.assertTrue(isinstance(offer["priceCurrency"], str))
            self.assertTrue(isinstance(offer["price"], float))

    def test_templates_course_runs_offers_dict_rdfa_paid(self):
        """
        Validates the content of the generated rdfa dict for a paid offer
        """

        course: Course = factories.CourseFactory()
        factories.CourseRunFactory(
            direct_course=course, price="77.51", offer="paid", price_currency="EUR"
        )

        info = course.generate_course_runs_offers_dict_rdfa()

        self.assertTrue(isinstance(info, dict))
        self.assertTrue(isinstance(info["offers"], list))
        self.assertEqual(len(info["offers"]), 1)

        offer = info["offers"][0]

        self.assertTrue(isinstance(offer, dict))
        self.assertEqual(offer["@type"], "Offer")
        self.assertEqual(offer["category"], "Paid")
        self.assertEqual(offer["priceCurrency"], "EUR")
        self.assertEqual(offer["price"], 77.51)

    def test_templates_course_runs_offers_dict_rdfa_free(self):
        """
        Validates the content of the generated rdfa dict for a free offer
        """

        course: Course = factories.CourseFactory()
        factories.CourseRunFactory(
            direct_course=course, price="64.02", offer="free", price_currency="EUR"
        )

        info = course.generate_course_runs_offers_dict_rdfa()

        self.assertTrue(isinstance(info, dict))
        self.assertTrue(isinstance(info["offers"], list))
        self.assertEqual(len(info["offers"]), 1)

        offer = info["offers"][0]

        self.assertTrue(isinstance(offer, dict))
        self.assertEqual(offer["@type"], "Offer")
        self.assertEqual(offer["category"], "Free")
        self.assertEqual(offer["priceCurrency"], "EUR")
        self.assertEqual(offer["price"], 64.02)

    def test_templates_course_runs_offers_dict_rdfa_partiallty_free(self):
        """
        Validates the content of the generated rdfa dict for a partiallty free offer
        """

        course: Course = factories.CourseFactory()
        factories.CourseRunFactory(
            direct_course=course,
            price="31.09",
            offer="partially_free",
            price_currency="EUR",
        )

        info = course.generate_course_runs_offers_dict_rdfa()

        self.assertTrue(isinstance(info, dict))
        self.assertTrue(isinstance(info["offers"], list))
        self.assertEqual(len(info["offers"]), 1)

        offer = info["offers"][0]

        self.assertTrue(isinstance(offer, dict))
        self.assertEqual(offer["@type"], "Offer")
        self.assertEqual(offer["category"], "Partially Free")
        self.assertEqual(offer["priceCurrency"], "EUR")
        self.assertEqual(offer["price"], 31.09)

    def test_templates_course_runs_offers_dict_rdfa_subscription(self):
        """
        Validates the content of the generated rdfa dict for a subscription offer
        """

        course: Course = factories.CourseFactory()
        factories.CourseRunFactory(
            direct_course=course,
            price="31.09",
            offer="subscription",
            price_currency="EUR",
        )

        info = course.generate_course_runs_offers_dict_rdfa()

        self.assertTrue(isinstance(info, dict))
        self.assertTrue(isinstance(info["offers"], list))
        self.assertEqual(len(info["offers"]), 1)

        offer = info["offers"][0]

        self.assertTrue(isinstance(offer, dict))
        self.assertEqual(offer["@type"], "Offer")
        self.assertEqual(offer["category"], "Subscription")
        self.assertEqual(offer["priceCurrency"], "EUR")
        self.assertEqual(offer["price"], 31.09)

"""
Unit tests for the Course model
"""
from django.core.exceptions import ValidationError
from django.test import TestCase
from django.test.client import RequestFactory

from cms.api import create_page

from richie.apps.courses.factories import (
    CategoryFactory,
    CourseFactory,
    CourseRunFactory,
    OrganizationFactory,
    PersonFactory,
)
from richie.apps.courses.models import CourseRun

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
        course = CourseFactory()
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
        course = CourseFactory()
        self.assertIsNone(course.duration)

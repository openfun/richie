"""
Unit tests for the course models
"""
from uuid import UUID

from django.db import DataError, IntegrityError
from django.test import TestCase
from django.utils import translation

from cms.api import create_page
from cms.models import Page

from apps.organizations.factories import OrganizationFactory

from ..factories import CourseFactory, CourseSubjectFactory
from ..models import (
    CourseSubject,
    CoursePage,
    CourseSubjectPage,
    CourseOrganizationRelation,
)


class CourseTestCase(TestCase):
    """
    Unit test suite to validate the behavior of the Course model
    """

    def test_course_fields_id(self):
        """
        The `id` field should be a UUID
        """
        course = CourseFactory()
        self.assertEqual(type(course.pk), UUID)
        self.assertEqual(len(str(course.pk)), 36)

    def test_course_fields_name_required(self):
        """
        The `name` field should be required
        """
        with self.assertRaises(IntegrityError):
            CourseFactory(name=None)

    def test_course_fields_name_max_length(self):
        """
        The `name` field should be limited to 255 characters
        """
        CourseFactory(name="a" * 255)
        with self.assertRaises(DataError):
            CourseFactory(name="a" * 256)

    def test_course_fields_active_session_max_length(self):
        """
        The `active_session` field should be limited to 200 characters
        """
        CourseFactory(active_session="a" * 200)
        with self.assertRaises(DataError):
            CourseFactory(active_session="a" * 201)

    def test_course_fields_active_session_unique(self):
        """
        The `active_session` field should be unique
        """
        CourseFactory(active_session="a" * 200)
        with self.assertRaises(IntegrityError):
            CourseFactory(active_session="a" * 200)

    def test_course_get_page_exists(self):
        """
        Getting the page for a course should generate only 1 query and
        retrieve the draft version of the page.
        """
        page = create_page("A course", "courses/cms/course_detail.html", "en")
        course = CourseFactory(
            name="A course", active_session="course-v1:orga+0000+test"
        )
        CoursePage.objects.create(course=course, extended_object=page)
        page.publish("en")

        # Check that the page exists in 2 version (draft an published)
        self.assertEqual(Page.objects.count(), 2)

        # Check that we could retrieve the page in only 1 database query
        with self.assertNumQueries(1):
            retrieved_page = course.get_page()

        # Check that the correct page was retrieved
        self.assertEqual(retrieved_page, page)
        self.assertTrue(retrieved_page.publisher_is_draft)

    def test_course_get_page_none(self):
        """
        Trying to retrieve the page from a course should return "None" if it
        does not exist.
        """
        course = CourseFactory()
        self.assertIsNone(course.get_page())


class CourseSubjectTestCase(TestCase):
    """
    Unit test suite to validate the behavior of the CourseSubject model
    Note that when using django-parler models we have to force the
    activation of a language while accessing i18ned properties
    """

    def test_course_subject_fields_id(self):
        """
        The `id` field should be a UUID
        """
        course_subject = CourseSubjectFactory()
        self.assertEqual(type(course_subject.pk), UUID)
        self.assertEqual(len(str(course_subject.pk)), 36)

    def test_course_subject_fields_name_required(self):
        """
        The `name` field should be required
        """
        with translation.override("en"):
            with self.assertRaises(IntegrityError):
                CourseSubjectFactory(name=None)

    def test_course_subject_fields_name_max_length(self):
        """
        The `name` field should be limited to 255 characters
        """
        with translation.override("en"):
            CourseSubjectFactory(name="a" * 255)
            with self.assertRaises(DataError):
                CourseSubjectFactory(name="a" * 256)

    def test_course_subject_fields_short_name_not_required(self):
        """
        The `short_name` field should not be required
        """
        with translation.override("en"):
            course_subject = CourseSubject.objects.create(
                name="a" * 255, short_name=None
            )
            self.assertEqual(course_subject.short_name, None)

    def test_course_subject_fields_short_name_max_length(self):
        """
        The `name` field should be limited to 255 characters
        """
        with translation.override("en"):
            CourseSubjectFactory(short_name="a" * 255)
            with self.assertRaises(DataError):
                CourseSubjectFactory(short_name="a" * 256)

    def test_course_subject_get_page_exists(self):
        """
        Getting the page for a course subject should generate only 1 query and
        retrieve the draft version of the page.
        """
        page = create_page(
            "A course subject", "courses/cms/course_subject_detail.html", "en"
        )
        course_subject = CourseSubjectFactory(with_translations=["en"])
        CourseSubjectPage.objects.create(
            course_subject=course_subject, extended_object=page
        )
        page.publish("en")

        # Check that the page exists in 2 version (draft an published)
        self.assertEqual(Page.objects.count(), 2)

        # Check that we could retrieve the page in only 1 database query
        with self.assertNumQueries(1):
            retrieved_page = course_subject.get_page()

        # Check that the correct page was retrieved
        self.assertEqual(retrieved_page, page)
        self.assertTrue(retrieved_page.publisher_is_draft)

    def test_course_get_page_none(self):
        """
        Trying to retrieve the page from a course subject should return "None" if it
        does not exist.
        """
        course_subject = CourseSubjectFactory()
        self.assertIsNone(course_subject.get_page())


class CourseOrganizationRelationTestCase(TestCase):
    """
    Unit test suite to validate the behavior of the CourseOrganizationRelation model
    """

    def test_course_organizations_order(self):
        """
        When retriveing course organizations through CourseOrganizationRelation,
        they should be ordered in rank order.
        """
        course = CourseFactory()
        organization1 = OrganizationFactory()
        organization2 = OrganizationFactory()
        CourseOrganizationRelation.objects.create(
            course=course, organization=organization1, rank=1
        )
        CourseOrganizationRelation.objects.create(
            course=course, organization=organization2, rank=2
        )
        # we use relation related_name to access ordered organizations
        self.assertEqual(
            course.related_organizations.all()[0].organization.name, organization1.name
        )

    def test_course_organizations_rank_unicity(self):
        """
        Rank must be unique amongs organization for a given course
        """
        course = CourseFactory()
        organization1 = OrganizationFactory()
        organization2 = OrganizationFactory()
        CourseOrganizationRelation.objects.create(
            course=course, organization=organization1, rank=1
        )

        with self.assertRaises(IntegrityError):
            CourseOrganizationRelation.objects.create(
                course=course, organization=organization2, rank=1
            )

    def test_course_organization_unicity(self):
        """
        An organization should not appear several times for a given course
        """
        course = CourseFactory()
        organization = OrganizationFactory()
        CourseOrganizationRelation.objects.create(
            course=course, organization=organization, rank=1
        )

        with self.assertRaises(IntegrityError):
            CourseOrganizationRelation.objects.create(
                course=course, organization=organization, rank=2
            )

"""
Validate course specific factories logic
"""

import re

from django.conf import settings
from django.test import TestCase
from django.utils import translation

from apps.organizations.factories import OrganizationFactory

from ..models import CourseOrganizationRelation
from ..factories import CourseFactory, CourseSubjectFactory


# This is the edX course_key pattern regexp
# it matches new splitmongo course key format: `course-v1:umontpellier+08xxx+demotest`
# and old one: `Paris1/16004S02/session02`
COURSE_KEY_PATTERN = r"(?P<course_key_string>[^/+]+(/|\+)[^/+]+(/|\+)[^/?]+)"


class CourseFactoryTestCase(TestCase):
    """CourseFactory test case"""

    def test_course_key(self):
        """Course `active_session` field should match edX course_key regexp."""
        course = CourseFactory()
        self.assertEqual(
            re.match(COURSE_KEY_PATTERN, course.active_session).groupdict()[
                "course_key_string"
            ],
            course.active_session,
        )

    def test_course_organization_relation(self):
        """ If Organizations are passed to CourseFactory,
            They should be ranked in the same order
        """
        organizations = OrganizationFactory.create_batch(3)
        organizations.reverse()
        course = CourseFactory(with_organizations=organizations)
        course_relations = CourseOrganizationRelation.objects.filter(course=course)
        for orga, rel in zip(organizations, course_relations):
            self.assertEqual(orga.id, rel.organization_id)


class CourseSubjectFactoryTestCase(TestCase):
    """CourseSubjectFactory test case"""

    def test_course_subject_default_language(self):
        """If no language provided, CourseSubjectFactory should only use default site language"""
        translation.deactivate_all()
        course_subject = CourseSubjectFactory()
        self.assertEqual(1, course_subject.get_available_languages().count())
        self.assertEqual(
            settings.LANGUAGE_CODE, course_subject.get_available_languages().first()
        )

    def test_course_subject_active_language(self):
        """If a language is active, it should be used by CourseSubjectFactory"""
        with translation.override("fr"):
            course_subject = CourseSubjectFactory()
        self.assertEqual(1, course_subject.get_available_languages().count())
        self.assertEqual("fr", course_subject.get_available_languages().first())

    def test_course_subject_given_languages(self):
        """If languages are provided, they all should be used by CourseSubjectFactory"""
        languages = ["fr", "en"]
        course_subject = CourseSubjectFactory(with_translations=languages)
        self.assertEqual(2, course_subject.get_available_languages().count())
        self.assertEqual(
            set(languages),
            set(
                course_subject.get_available_languages().values_list(
                    "language_code", flat=True
                )
            ),
        )

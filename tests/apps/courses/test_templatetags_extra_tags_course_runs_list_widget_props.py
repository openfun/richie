"""
Unit tests for the `course_runs_list_widget_props` template filter.
"""

import json

from django.contrib.auth.models import AnonymousUser
from django.test import RequestFactory
from django.test.utils import override_settings

from cms.test_utils.testcases import CMSTestCase
from cms.toolbar.toolbar import CMSToolbar

from richie.apps.courses import factories
from richie.apps.courses.models import CourseRunCatalogVisibility
from richie.apps.courses.templatetags.extra_tags import course_runs_list_widget_props


class CourseEnrollmentWidgetPropsTagTestCase(CMSTestCase):
    """
    Unit test suite to validate the behavior of the `course_runs_list_widget_props` tag.
    """

    @override_settings(TIME_ZONE="UTC")
    def test_templatetags_course_runs_list_widget_props_tag(self):
        """
        The tag should return a JSON array of published course runs only with
        a visibility_catalog different from "hidden" and not to be scheduled.
        """
        course = factories.CourseFactory(should_publish=True)
        course_run = factories.CourseRunFactory(
            direct_course=course,
            offer="paid",
            price="59.99",
            certificate_offer="paid",
            certificate_price="29.99",
        )

        # Create a hidden course run
        factories.CourseRunFactory(
            catalog_visibility=CourseRunCatalogVisibility.HIDDEN,
            direct_course=course,
        )
        # Create a "to be scheduled" course run
        factories.CourseRunFactory(
            start=None,
            direct_course=course,
        )

        request = RequestFactory().get("/")
        request.current_page = course.extended_object

        context = {"course": course_run.direct_course, "request": request}

        self.assertEqual(
            course_runs_list_widget_props(context),
            json.dumps(
                {
                    "course": {
                        "id": course.id,
                        "code": course.code,
                        "is_self_paced": course.is_self_paced,
                    },
                    "courseRuns": [
                        {
                            "id": course_run.id,
                            "title": course_run.title,
                            "resource_link": course_run.resource_link,
                            "start": (
                                course_run.start.isoformat().replace("+00:00", "Z")
                                if course_run.start
                                else None
                            ),
                            "end": (
                                course_run.end.isoformat().replace("+00:00", "Z")
                                if course_run.end
                                else None
                            ),
                            "enrollment_start": (
                                course_run.enrollment_start.isoformat().replace(
                                    "+00:00", "Z"
                                )
                                if course_run.enrollment_start
                                else None
                            ),
                            "enrollment_end": (
                                course_run.enrollment_end.isoformat().replace(
                                    "+00:00", "Z"
                                )
                                if course_run.enrollment_end
                                else None
                            ),
                            "languages": sorted(course_run.languages),
                            "catalog_visibility": course_run.catalog_visibility,
                            "display_mode": "detailed",
                            "snapshot": None,
                            "price": "59.99",
                            "price_currency": "EUR",
                            "offer": "paid",
                            "certificate_price": "29.99",
                            "certificate_offer": "paid",
                        }
                    ],
                    "maxArchivedCourseRuns": 10,
                }
            ),
        )

    @override_settings(TIME_ZONE="UTC")
    def test_templatetags_course_runs_list_widget_props_tag_with_snapshot(self):
        """
        If course run is the child of a snapshot of the current course page, it should
        contain the url of the snapshot page.
        """
        course = factories.CourseFactory(should_publish=True)
        snapshot = factories.CourseFactory(page_parent=course.extended_object)
        course_run = factories.CourseRunFactory(
            direct_course=snapshot,
            offer="paid",
            price="59.99",
            certificate_offer="paid",
            certificate_price="29.99",
        )

        request = RequestFactory().get("/")
        request.current_page = course.extended_object

        context = {"course": course, "request": request}

        self.assertEqual(
            course_runs_list_widget_props(context),
            json.dumps(
                {
                    "course": {
                        "id": course.id,
                        "code": course.code,
                        "is_self_paced": course.is_self_paced,
                    },
                    "courseRuns": [
                        {
                            "id": course_run.id,
                            "title": course_run.title,
                            "resource_link": course_run.resource_link,
                            "start": (
                                course_run.start.isoformat().replace("+00:00", "Z")
                                if course_run.start
                                else None
                            ),
                            "end": (
                                course_run.end.isoformat().replace("+00:00", "Z")
                                if course_run.end
                                else None
                            ),
                            "enrollment_start": (
                                course_run.enrollment_start.isoformat().replace(
                                    "+00:00", "Z"
                                )
                                if course_run.enrollment_start
                                else None
                            ),
                            "enrollment_end": (
                                course_run.enrollment_end.isoformat().replace(
                                    "+00:00", "Z"
                                )
                                if course_run.enrollment_end
                                else None
                            ),
                            "languages": sorted(course_run.languages),
                            "catalog_visibility": course_run.catalog_visibility,
                            "display_mode": "detailed",
                            "snapshot": snapshot.extended_object.get_absolute_url(),
                            "price": "59.99",
                            "price_currency": "EUR",
                            "offer": "paid",
                            "certificate_price": "29.99",
                            "certificate_offer": "paid",
                        }
                    ],
                    "maxArchivedCourseRuns": 10,
                }
            ),
        )

    @override_settings(TIME_ZONE="UTC", RICHIE_MAX_ARCHIVED_COURSE_RUNS=3)
    def test_templatetags_course_runs_list_widget_props_tag_edit_mode(self):
        """
        In edit mode, the tag should return a JSON array of all course runs linked
        to the course.
        """

        course = factories.CourseFactory(
            code="DemoX", page_languages=["en"], should_publish=False
        )
        factories.CourseRunFactory(
            direct_course=course,
            offer="paid",
            price="59.99",
            certificate_offer="paid",
            certificate_price="29.99",
        )
        # Create a hidden course run
        factories.CourseRunFactory(
            catalog_visibility=CourseRunCatalogVisibility.HIDDEN,
            direct_course=course,
            offer="paid",
            price="59.99",
            certificate_offer="paid",
            certificate_price="29.99",
        )
        # Create a "to be scheduled" course run
        factories.CourseRunFactory(
            start=None,
            direct_course=course,
            offer="paid",
            price="59.99",
            certificate_offer="paid",
            certificate_price="29.99",
        )

        page = course.extended_object
        request = RequestFactory().get("/")
        request.current_page = page
        user = AnonymousUser()
        request.user = user
        request.session = {"cms_edit": True}
        request.toolbar = CMSToolbar(request)
        request.toolbar.edit_mode_active = True

        context = {"course": course, "request": request}

        self.assertEqual(
            course_runs_list_widget_props(context),
            json.dumps(
                {
                    "course": {
                        "id": course.id,
                        "code": course.code,
                        "is_self_paced": course.is_self_paced,
                    },
                    "courseRuns": [
                        {
                            "id": course_run.id,
                            "title": course_run.title,
                            "resource_link": course_run.resource_link,
                            "start": (
                                course_run.start.isoformat().replace("+00:00", "Z")
                                if course_run.start
                                else None
                            ),
                            "end": (
                                course_run.end.isoformat().replace("+00:00", "Z")
                                if course_run.end
                                else None
                            ),
                            "enrollment_start": (
                                course_run.enrollment_start.isoformat().replace(
                                    "+00:00", "Z"
                                )
                                if course_run.enrollment_start
                                else None
                            ),
                            "enrollment_end": (
                                course_run.enrollment_end.isoformat().replace(
                                    "+00:00", "Z"
                                )
                                if course_run.enrollment_end
                                else None
                            ),
                            "languages": sorted(course_run.languages),
                            "catalog_visibility": course_run.catalog_visibility,
                            "display_mode": "detailed",
                            "snapshot": None,
                            "price": "59.99",
                            "price_currency": "EUR",
                            "offer": "paid",
                            "certificate_price": "29.99",
                            "certificate_offer": "paid",
                        }
                        for course_run in course.course_runs.all()
                    ],
                    "maxArchivedCourseRuns": 3,
                }
            ),
        )

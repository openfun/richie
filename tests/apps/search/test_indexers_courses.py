"""
Tests for the course indexer
"""
from datetime import datetime
from unittest import mock

from django.test import TestCase

import pytz
from cms.api import add_plugin

from richie.apps.courses.cms_plugins import CategoryPlugin
from richie.apps.courses.defaults import DAY, HOUR, MINUTE, WEEK
from richie.apps.courses.factories import (
    CategoryFactory,
    CourseFactory,
    CourseRunFactory,
    OrganizationFactory,
    PersonFactory,
)
from richie.apps.courses.models import CourseState
from richie.apps.search.indexers.categories import CategoriesIndexer
from richie.apps.search.indexers.courses import CoursesIndexer
from richie.apps.search.indexers.organizations import OrganizationsIndexer
from richie.plugins.simple_picture.cms_plugins import SimplePicturePlugin


class CoursesIndexersTestCase(TestCase):
    """
    Test the get_es_documents() function on the course indexer, as well as our mapping,
    and especially dynamic mapping shape in ES
    """

    def test_indexers_courses_related_objects_consistency(self):
        """
        The organization and category ids in the Elasticsearch course document should be
        the same as the ids with which the corresponding organization and category objects
        are indexed.
        """
        # Create a course with a page in both english and french
        organization = OrganizationFactory(should_publish=True)
        category = CategoryFactory(should_publish=True)
        course = CourseFactory(
            fill_organizations=[organization],
            fill_categories=[category],
            should_publish=True,
        )
        CourseRunFactory(page_parent=course.extended_object, should_publish=True)

        course_document = list(
            CoursesIndexer.get_es_documents(index="some_index", action="some_action")
        )[0]
        self.assertEqual(
            course_document["organizations"],
            [
                next(
                    OrganizationsIndexer.get_es_documents(
                        index="some_index", action="some_action"
                    )
                )["_id"]
            ],
        )
        self.assertEqual(
            course_document["categories"],
            [
                next(
                    CategoriesIndexer.get_es_documents(
                        index="some_index", action="some_action"
                    )
                )["_id"]
            ],
        )

    def test_indexers_courses_get_es_documents_no_course_run(self):
        """
        A course with no course run should still be indexed.
        """
        CourseFactory(should_publish=True)
        indexed_courses = list(
            CoursesIndexer.get_es_documents(index="some_index", action="some_action")
        )
        self.assertEqual(len(indexed_courses), 1)
        self.assertEqual(indexed_courses[0]["course_runs"], [])

    def test_indexers_courses_get_es_documents_snapshots(self):
        """
        Course snapshots should not get indexed.
        """
        course = CourseFactory(should_publish=True)
        CourseFactory(page_parent=course.extended_object, should_publish=True)

        indexed_courses = list(
            CoursesIndexer.get_es_documents(index="some_index", action="some_action")
        )
        self.assertEqual(len(indexed_courses), 1)
        self.assertEqual(
            indexed_courses[0]["_id"], str(course.public_extension.extended_object_id)
        )

    @mock.patch(
        "richie.apps.search.indexers.courses.get_picture_info",
        return_value={"info": "picture info"},
    )
    def test_indexers_courses_get_es_documents_from_models(self, _mock_picture):
        """
        Happy path: the data is retrieved from the models properly formatted
        """
        # Create a course with a page in both english and french
        published_categories = [
            CategoryFactory(  # L-0001
                fill_icon=True,
                page_title={"en": "Title L-0001", "fr": "Titre L-0001"},
                should_publish=True,
            ),
            CategoryFactory(  # L-0002
                fill_icon=True,
                page_title={"en": "Title L-0002", "fr": "Titre L-0002"},
                should_publish=True,
            ),
        ]
        draft_category = CategoryFactory(fill_icon=True)  # L-0003

        main_organization = OrganizationFactory(  # L-0004
            page_title={
                "en": "english main organization title",
                "fr": "titre organisation principale français",
            },
            should_publish=True,
        )
        other_draft_organization = OrganizationFactory(  # L-0005
            page_title={
                "en": "english other organization title",
                "fr": "titre autre organisation français",
            }
        )
        other_published_organization = OrganizationFactory(  # L-0006
            page_title={
                "en": "english other organization title",
                "fr": "titre autre organisation français",
            },
            should_publish=True,
        )

        person1 = PersonFactory(
            page_title={"en": "Eugène Delacroix", "fr": "Eugène Delacroix"},
            should_publish=True,
        )
        person2 = PersonFactory(
            page_title={"en": "Comte de Saint-Germain", "fr": "Earl of Saint-Germain"},
            should_publish=True,
        )
        person_draft = PersonFactory(
            page_title={"en": "Jules de Polignac", "fr": "Jules de Polignac"}
        )

        course = CourseFactory(
            duration=[3, WEEK],
            effort=[2, HOUR, WEEK],
            fill_categories=published_categories + [draft_category],
            fill_cover=True,
            fill_icons=published_categories + [draft_category],
            fill_organizations=[
                main_organization,
                other_draft_organization,
                other_published_organization,
            ],
            fill_team=[person1, person_draft, person2],
            page_title={
                "en": "an english course title",
                "fr": "un titre cours français",
            },
            should_publish=True,
        )
        CourseRunFactory.create_batch(
            2, page_parent=course.extended_object, should_publish=True
        )

        # Add a description in several languages
        placeholder = course.public_extension.extended_object.placeholders.get(
            slot="course_description"
        )
        plugin_params = {"placeholder": placeholder, "plugin_type": "CKEditorPlugin"}
        add_plugin(body="english description line 1.", language="en", **plugin_params)
        add_plugin(body="english description line 2.", language="en", **plugin_params)
        add_plugin(body="a propos français ligne 1.", language="fr", **plugin_params)
        add_plugin(body="a propos français ligne 2.", language="fr", **plugin_params)

        # The results were properly formatted and passed to the consumer
        expected_course = {
            "_id": str(course.public_extension.extended_object_id),
            "_index": "some_index",
            "_op_type": "some_action",
            "_type": "course",
            "absolute_url": {
                "en": "/en/an-english-course-title/",
                "fr": "/fr/un-titre-cours-francais/",
            },
            "categories": ["L-0001", "L-0002"],
            "categories_names": {
                "en": ["Title L-0001", "Title L-0002"],
                "fr": ["Titre L-0001", "Titre L-0002"],
            },
            "complete": {
                "en": [
                    "an english course title",
                    "english course title",
                    "course title",
                    "title",
                ],
                "fr": [
                    "un titre cours français",
                    "titre cours français",
                    "cours français",
                    "français",
                ],
            },
            "course_runs": [
                {
                    "start": course_run.public_extension.start,
                    "end": course_run.public_extension.end,
                    "enrollment_start": course_run.public_extension.enrollment_start,
                    "enrollment_end": course_run.public_extension.enrollment_end,
                    "languages": course_run.public_extension.languages,
                }
                for course_run in course.get_course_runs().order_by("-end")
            ],
            "cover_image": {
                "en": {"info": "picture info"},
                "fr": {"info": "picture info"},
            },
            "description": {
                "en": "english description line 1. english description line 2.",
                "fr": "a propos français ligne 1. a propos français ligne 2.",
            },
            "duration": {"en": "3 weeks", "fr": "3 semaines"},
            "effort": {"en": "2 hours/week", "fr": "2 heures/semaine"},
            "icon": {
                "en": {
                    "color": published_categories[0].color,
                    "info": "picture info",
                    "title": "Title L-0001",
                },
                "fr": {
                    "color": published_categories[0].color,
                    "info": "picture info",
                    "title": "Titre L-0001",
                },
            },
            "is_new": False,
            "organization_highlighted": {
                "en": "english main organization title",
                "fr": "titre organisation principale français",
            },
            "organizations": ["L-0004", "L-0006"],
            "organizations_names": {
                "en": [
                    "english main organization title",
                    "english other organization title",
                ],
                "fr": [
                    "titre organisation principale français",
                    "titre autre organisation français",
                ],
            },
            "persons": [
                str(person1.public_extension.extended_object_id),
                str(person2.public_extension.extended_object_id),
            ],
            "persons_names": {
                "en": ["Eugène Delacroix", "Comte de Saint-Germain"],
                "fr": ["Eugène Delacroix", "Earl of Saint-Germain"],
            },
            "title": {"fr": "un titre cours français", "en": "an english course title"},
        }
        indexed_courses = list(
            CoursesIndexer.get_es_documents(index="some_index", action="some_action")
        )
        self.assertEqual(len(indexed_courses), 1)
        self.assertEqual(indexed_courses[0], expected_course)

    def test_indexers_courses_get_es_document_no_organization(self):
        """
        Courses with no linked organizations should get indexed without raising exceptions.
        """
        course = CourseFactory(
            duration=[12, WEEK],
            effort=[5, MINUTE, DAY],
            page_title="Enhanced incremental circuit",
            should_publish=True,
        )
        indexed_courses = list(
            CoursesIndexer.get_es_documents(index="some_index", action="some_action")
        )
        self.assertEqual(
            indexed_courses,
            [
                {
                    "_id": str(course.extended_object.publisher_public_id),
                    "_index": "some_index",
                    "_op_type": "some_action",
                    "_type": "course",
                    "absolute_url": {"en": "/en/enhanced-incremental-circuit/"},
                    "categories": [],
                    "categories_names": {},
                    "complete": {
                        "en": [
                            "Enhanced incremental circuit",
                            "incremental circuit",
                            "circuit",
                        ]
                    },
                    "course_runs": [],
                    "cover_image": {},
                    "description": {},
                    "duration": {"en": "12 weeks", "fr": "12 semaines"},
                    "effort": {"en": "5 minutes/day", "fr": "5 minutes/jour"},
                    "icon": {},
                    "is_new": False,
                    "organization_highlighted": None,
                    "organizations": [],
                    "organizations_names": {},
                    "persons": [],
                    "persons_names": {},
                    "title": {"en": "Enhanced incremental circuit"},
                }
            ],
        )

    def test_indexers_courses_get_es_documents_no_start(self):
        """
        Course runs with no start date should not get indexed.
        """
        course = CourseFactory(should_publish=True)
        CourseRunFactory(
            page_parent=course.extended_object, start=None, should_publish=True
        )

        indexed_courses = list(
            CoursesIndexer.get_es_documents(index="some_index", action="some_action")
        )
        self.assertEqual(len(indexed_courses), 1)
        self.assertEqual(indexed_courses[0]["course_runs"], [])

    def test_indexers_courses_get_es_documents_no_enrollment_start(self):
        """
        Course runs with no start of enrollment date should not get indexed.
        """
        course = CourseFactory(should_publish=True)
        CourseRunFactory(
            page_parent=course.extended_object,
            enrollment_start=None,
            should_publish=True,
        )

        indexed_courses = list(
            CoursesIndexer.get_es_documents(index="some_index", action="some_action")
        )
        self.assertEqual(len(indexed_courses), 1)
        self.assertEqual(indexed_courses[0]["course_runs"], [])

    def test_indexers_courses_get_es_documents_no_enrollment_end(self):
        """
        Course runs with no end of enrollment date should get their end date as date of end
        of enrollment.
        """
        course = CourseFactory(should_publish=True)
        course_run = CourseRunFactory(
            page_parent=course.extended_object, enrollment_end=None, should_publish=True
        )

        indexed_courses = list(
            CoursesIndexer.get_es_documents(index="some_index", action="some_action")
        )
        self.assertEqual(len(indexed_courses), 1)
        self.assertEqual(len(indexed_courses[0]["course_runs"]), 1)
        self.assertEqual(
            indexed_courses[0]["course_runs"][0]["enrollment_end"], course_run.end
        )

    def test_indexers_courses_get_es_documents_no_end(self):
        """
        Course runs with no end date should be on-going for ever.
        """
        course = CourseFactory(should_publish=True)
        CourseRunFactory(
            page_parent=course.extended_object, end=None, should_publish=True
        )

        indexed_courses = list(
            CoursesIndexer.get_es_documents(index="some_index", action="some_action")
        )
        self.assertEqual(len(indexed_courses), 1)
        self.assertEqual(len(indexed_courses[0]["course_runs"]), 1)
        self.assertEqual(indexed_courses[0]["course_runs"][0]["end"].year, 9999)

    def test_indexers_courses_get_es_documents_no_end_no_enrollment_end(self):
        """
        Course runs with no end date and no date of end of enrollment should be open for ever.
        """
        course = CourseFactory(should_publish=True)
        CourseRunFactory(
            page_parent=course.extended_object,
            end=None,
            enrollment_end=None,
            should_publish=True,
        )

        indexed_courses = list(
            CoursesIndexer.get_es_documents(index="some_index", action="some_action")
        )
        self.assertEqual(len(indexed_courses), 1)
        self.assertEqual(len(indexed_courses[0]["course_runs"]), 1)
        self.assertEqual(indexed_courses[0]["course_runs"][0]["end"].year, 9999)
        self.assertEqual(
            indexed_courses[0]["course_runs"][0]["enrollment_end"].year, 9999
        )

    def test_indexers_courses_get_es_document_no_image_cover_picture(self):
        """
        ES document is created without errors when a cover image for the course is
        actually a Picture instance without an image on it.
        """
        # Create the example course to index and get hold of its course_cover placeholder
        course = CourseFactory(should_publish=True)
        course_cover_placeholder = (
            course.extended_object.get_public_object()
            .placeholders.filter(slot="course_cover")
            .first()
        )
        # Make sure we associate an image-less picture with the course through
        # the cover placeholder
        add_plugin(course_cover_placeholder, SimplePicturePlugin, "en", picture=None)
        course.extended_object.publish("en")

        indexed_courses = list(
            CoursesIndexer.get_es_documents(index="some_index", action="some_action")
        )

        self.assertEqual(len(indexed_courses), 1)
        self.assertEqual(
            indexed_courses[0]["_id"],
            str(course.extended_object.get_public_object().id),
        )
        self.assertEqual(indexed_courses[0]["cover_image"], {})

    def test_indexers_courses_get_es_document_no_image_icon_picture(self):
        """
        ES document is created without errors when a icon image for the course is
        actually a Picture instance without an image on it.
        """
        # Create the example course to index and get hold of its course_icons placeholder
        course = CourseFactory(should_publish=True)
        course_icons_placeholder = course.extended_object.placeholders.filter(
            slot="course_icons"
        ).first()
        # Create a category and add it to the course on the icons placeholder
        category = CategoryFactory(should_publish=True, color="#654321")
        add_plugin(
            course_icons_placeholder,
            CategoryPlugin,
            "en",
            **{"page": category.extended_object}
        )
        course.extended_object.publish("en")
        # Make sure we associate an image-less picture with the category through
        # the icon placeholder
        category_icon_placeholder = category.extended_object.placeholders.filter(
            slot="icon"
        ).first()
        add_plugin(category_icon_placeholder, SimplePicturePlugin, "en", picture=None)
        category.extended_object.publish("en")

        indexed_courses = list(
            CoursesIndexer.get_es_documents(index="some_index", action="some_action")
        )

        self.assertEqual(len(indexed_courses), 1)
        self.assertEqual(
            indexed_courses[0]["_id"],
            str(course.extended_object.get_public_object().id),
        )
        self.assertEqual(
            indexed_courses[0]["icon"],
            {"en": {"color": "#654321", "title": category.extended_object.get_title()}},
        )

    def test_indexers_courses_format_es_object_for_api(self):
        """
        Make sure format_es_object_for_api returns a properly formatted course
        """
        es_course = {
            "_id": 93,
            "_source": {
                "absolute_url": {"en": "campo-qui-format-do"},
                "categories": [43, 86],
                "cover_image": {"en": "cover_image.jpg"},
                "duration": {"en": "6 months"},
                "effort": {"en": "3 hours/day"},
                "icon": {"en": "icon.jpg"},
                "organization_highlighted": {"en": "Org 84"},
                "organizations": [42, 84],
                "organizations_names": {"en": ["Org 42", "Org 84"]},
                "title": {"en": "Duis eu arcu erat"},
            },
            "fields": {
                "state": [
                    {"priority": 0, "date_time": "2019-03-17T21:25:52.179667+00:00"}
                ]
            },
        }
        self.assertEqual(
            CoursesIndexer.format_es_object_for_api(es_course, "en"),
            {
                "id": 93,
                "absolute_url": "campo-qui-format-do",
                "categories": [43, 86],
                "cover_image": "cover_image.jpg",
                "duration": "6 months",
                "effort": "3 hours/day",
                "icon": "icon.jpg",
                "organization_highlighted": "Org 84",
                "organizations": [42, 84],
                "title": "Duis eu arcu erat",
                "state": CourseState(
                    0, datetime(2019, 3, 17, 21, 25, 52, 179667, pytz.utc)
                ),
            },
        )

    def test_indexers_courses_format_es_object_for_api_no_organization(self):
        """
        A course that has no organization and was indexed should not raise 500 errors (although
        this should not happen if courses are correctly moderated).
        """
        es_course = {
            "_id": 93,
            "_source": {
                "absolute_url": {"en": "campo-qui-format-do"},
                "categories": [43, 86],
                "cover_image": {"en": "cover_image.jpg"},
                "duration": {"en": "3 weeks"},
                "effort": {"en": "10 minutes/week"},
                "icon": {"en": "icon.jpg"},
                "organization_highlighted": None,
                "organizations": [],
                "organizations_names": {},
                "title": {"en": "Duis eu arcu erat"},
            },
            "fields": {
                "state": [
                    {"priority": 0, "date_time": "2019-03-17T21:25:52.179667+00:00"}
                ]
            },
        }
        self.assertEqual(
            CoursesIndexer.format_es_object_for_api(es_course, "en"),
            {
                "id": 93,
                "absolute_url": "campo-qui-format-do",
                "categories": [43, 86],
                "cover_image": "cover_image.jpg",
                "duration": "3 weeks",
                "effort": "10 minutes/week",
                "icon": "icon.jpg",
                "organization_highlighted": None,
                "organizations": [],
                "title": "Duis eu arcu erat",
                "state": CourseState(
                    0, datetime(2019, 3, 17, 21, 25, 52, 179667, pytz.utc)
                ),
            },
        )

    def test_indexers_courses_format_es_object_for_api_no_icon(self):
        """
        A course that has no icon and was indexed should not raise any errors.
        """
        es_course = {
            "_id": 93,
            "_source": {
                "absolute_url": {"en": "campo-qui-format-do"},
                "categories": [43, 86],
                "cover_image": {"en": "cover_image.jpg"},
                "duration": {"en": "N/A"},
                "effort": {"en": "N/A"},
                "icon": {},
                "organization_highlighted": {"en": "Org 84"},
                "organizations": [42, 84],
                "organizations_names": {"en": ["Org 42", "Org 84"]},
                "title": {"en": "Duis eu arcu erat"},
            },
            "fields": {
                "state": [
                    {"priority": 0, "date_time": "2019-03-17T21:25:52.179667+00:00"}
                ]
            },
        }
        self.assertEqual(
            CoursesIndexer.format_es_object_for_api(es_course, "en"),
            {
                "id": 93,
                "absolute_url": "campo-qui-format-do",
                "categories": [43, 86],
                "cover_image": "cover_image.jpg",
                "duration": "N/A",
                "effort": "N/A",
                "icon": None,
                "organization_highlighted": "Org 84",
                "organizations": [42, 84],
                "title": "Duis eu arcu erat",
                "state": CourseState(
                    0, datetime(2019, 3, 17, 21, 25, 52, 179667, pytz.utc)
                ),
            },
        )

    def test_indexers_courses_format_es_object_for_api_no_cover(self):
        """
        A course that has no cover image and was indexed should not raise any errors.
        """
        es_course = {
            "_id": 93,
            "_source": {
                "absolute_url": {"en": "campo-qui-format-do"},
                "categories": [43, 86],
                "cover_image": {},
                "duration": {"en": "N/A"},
                "effort": {"en": "N/A"},
                "icon": {"en": "icon.jpg"},
                "organization_highlighted": {"en": "Org 42"},
                "organizations": [42, 84],
                "organizations_names": {"en": ["Org 42", "Org 84"]},
                "title": {"en": "Duis eu arcu erat"},
            },
            "fields": {
                "state": [
                    {"priority": 0, "date_time": "2019-03-17T21:25:52.179667+00:00"}
                ]
            },
        }
        self.assertEqual(
            CoursesIndexer.format_es_object_for_api(es_course, "en"),
            {
                "id": 93,
                "absolute_url": "campo-qui-format-do",
                "categories": [43, 86],
                "cover_image": None,
                "duration": "N/A",
                "effort": "N/A",
                "icon": "icon.jpg",
                "organization_highlighted": "Org 42",
                "organizations": [42, 84],
                "title": "Duis eu arcu erat",
                "state": CourseState(
                    0, datetime(2019, 3, 17, 21, 25, 52, 179667, pytz.utc)
                ),
            },
        )

    def test_indexers_courses_format_es_document_for_autocomplete(self):
        """
        Make sure format_es_document_for_autocomplete returns a properly
        formatted course suggestion.
        """
        es_course = {
            "_id": 93,
            "_source": {
                "absolute_url": {"en": "/en/campo-qui-format-do"},
                "categories": [43, 86],
                "cover_image": {"en": "cover_image.jpg"},
                "icon": {"en": "icon.jpg"},
                "organizations": [42, 84],
                "organizations_names": {"en": ["Org 42", "Org 84"]},
                "title": {"en": "Duis eu arcu erat"},
            },
            "fields": {
                "state": [
                    {"priority": 0, "date_time": "2019-03-17T21:25:52.179667+00:00"}
                ]
            },
        }
        self.assertEqual(
            CoursesIndexer.format_es_document_for_autocomplete(es_course, "en"),
            {
                "absolute_url": "/en/campo-qui-format-do",
                "id": 93,
                "kind": "courses",
                "title": "Duis eu arcu erat",
            },
        )

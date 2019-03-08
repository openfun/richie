"""
Tests for the course indexer
"""
# pylint: disable=too-many-lines
from unittest import mock

from django.test import TestCase

from cms.api import add_plugin
from djangocms_picture.models import Picture

from richie.apps.courses.factories import (
    CategoryFactory,
    CourseFactory,
    CourseRunFactory,
    OrganizationFactory,
)
from richie.apps.search.indexers.categories import CategoriesIndexer
from richie.apps.search.indexers.courses import CoursesIndexer
from richie.apps.search.indexers.organizations import OrganizationsIndexer


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

    @mock.patch.object(
        Picture, "img_src", new_callable=mock.PropertyMock, return_value="123.jpg"
    )
    def test_indexers_courses_get_es_documents(self, _mock_picture):
        """
        Happy path: the data is retrieved from the models properly formatted
        """
        # Create a course with a page in both english and french
        published_categories = [
            CategoryFactory(
                page_title={"en": "Open-architected radical application"},
                should_publish=True,
            ),
            CategoryFactory(
                page_title={"en": "Public-key transitional solution"},
                should_publish=True,
            ),
        ]
        draft_category = CategoryFactory()

        main_organization = OrganizationFactory(
            page_title={
                "en": "english main organization title",
                "fr": "titre organisation principale français",
            },
            should_publish=True,
        )
        other_draft_organization = OrganizationFactory(
            page_title={
                "en": "english other organization title",
                "fr": "titre autre organisation français",
            }
        )
        other_published_organization = OrganizationFactory(
            page_title={
                "en": "english other organization title",
                "fr": "titre autre organisation français",
            },
            should_publish=True,
        )
        course = CourseFactory(
            page_title={
                "en": "an english course title",
                "fr": "un titre cours français",
            },
            fill_organizations=[
                main_organization,
                other_draft_organization,
                other_published_organization,
            ],
            fill_categories=published_categories + [draft_category],
            fill_cover=True,
            should_publish=True,
        )
        CourseRunFactory.create_batch(
            2, page_parent=course.extended_object, should_publish=True
        )

        # Add a syllabus in several languages
        placeholder = course.public_extension.extended_object.placeholders.get(
            slot="course_syllabus"
        )
        plugin_params = {"placeholder": placeholder, "plugin_type": "CKEditorPlugin"}
        add_plugin(body="english syllabus line 1.", language="en", **plugin_params)
        add_plugin(body="english syllabus line 2.", language="en", **plugin_params)
        add_plugin(body="syllabus français ligne 1.", language="fr", **plugin_params)
        add_plugin(body="syllabus français ligne 2.", language="fr", **plugin_params)

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
            "categories": [
                str(s.public_extension.extended_object_id) for s in published_categories
            ],
            "categories_names": {
                "en": [
                    "Open-architected radical application",
                    "Public-key transitional solution",
                ]
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
            "cover_image": {"en": "123.jpg", "fr": "123.jpg"},
            "description": {
                "en": "english syllabus line 1. english syllabus line 2.",
                "fr": "syllabus français ligne 1. syllabus français ligne 2.",
            },
            "is_new": False,
            "organizations": [
                str(main_organization.public_extension.extended_object_id),
                str(other_published_organization.public_extension.extended_object_id),
            ],
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
            "title": {"fr": "un titre cours français", "en": "an english course title"},
        }
        indexed_courses = list(
            CoursesIndexer.get_es_documents(index="some_index", action="some_action")
        )
        self.assertEqual(len(indexed_courses), 1)
        self.assertEqual(indexed_courses[0], expected_course)

    def test_indexers_courses_format_es_object_for_api(self):
        """
        Make sure format_es_object_for_api returns a properly formatted course
        """
        es_course = {
            "_id": 93,
            "_source": {
                "absolute_url": {"en": "campo-qui-format-do"},
                "course_runs": [
                    {
                        "end": "2018-02-28T06:00:00Z",
                        "enrollment_end": "2018-01-31T06:00:00Z",
                        "enrollment_start": "2018-01-01T06:00:00Z",
                        "start": "2018-02-01T06:00:00Z",
                        "languages": ["en", "es"],
                    }
                ],
                "cover_image": {"en": "image.jpg"},
                "organization_title": {"en": "campo qui format do"},
                "organizations": [42, 84],
                "description": {"en": "Nam aliquet, arcu at sagittis sollicitudin."},
                "categories": [43, 86],
                "title": {"en": "Duis eu arcu erat"},
            },
        }
        self.assertEqual(
            CoursesIndexer.format_es_object_for_api(es_course, "en"),
            {
                "id": 93,
                "absolute_url": "campo-qui-format-do",
                "cover_image": "image.jpg",
                "organizations": [42, 84],
                "categories": [43, 86],
                "title": "Duis eu arcu erat",
            },
        )

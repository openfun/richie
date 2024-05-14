"""
Tests for the course indexer
"""

from datetime import datetime, timezone
from unittest import mock

from django.test import TestCase

from cms.api import add_plugin, create_page

from richie.apps.core.helpers import create_i18n_page
from richie.apps.courses.cms_plugins import CategoryPlugin
from richie.apps.courses.defaults import HOUR, MINUTE, WEEK
from richie.apps.courses.factories import (
    CategoryFactory,
    CourseFactory,
    CourseRunFactory,
    LicenceFactory,
    OrganizationFactory,
    PersonFactory,
)
from richie.apps.courses.models import CourseState
from richie.apps.courses.models.course import CourseRunCatalogVisibility
from richie.apps.search.indexers.categories import CategoriesIndexer
from richie.apps.search.indexers.courses import CoursesIndexer
from richie.apps.search.indexers.organizations import OrganizationsIndexer
from richie.plugins.simple_picture.cms_plugins import SimplePicturePlugin

# pylint: disable=too-many-public-methods
# pylint: disable=too-many-lines


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
            fill_organizations=[organization], fill_categories=[category]
        )
        CourseRunFactory(direct_course=course)
        course.extended_object.publish("en")

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

    # get_es_document_for_course

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

    def test_indexers_courses_get_es_documents_unpublished_course(self):
        """Unpublished courses should not be indexed"""
        CourseFactory()

        self.assertEqual(
            list(
                CoursesIndexer.get_es_documents(
                    index="some_index", action="some_action"
                )
            ),
            [],
        )

    def test_indexers_courses_get_es_documents_unpublished_category(self):
        """
        Unpublished categories and children of unpublished categories should not be indexed
        """
        # Create a child category
        meta = CategoryFactory(
            page_parent=create_i18n_page("Categories", published=True),
            page_reverse_id="subjects",
            page_title="Subjects",
            should_publish=True,
        )
        parent = CategoryFactory(page_parent=meta.extended_object, should_publish=True)
        category = CategoryFactory(
            page_parent=parent.extended_object,
            page_title="my second subject",
            should_publish=True,
        )

        CourseFactory(fill_categories=[category], should_publish=True)

        # Unpublish the parent category
        self.assertTrue(parent.extended_object.unpublish("en"))

        course_document = list(
            CoursesIndexer.get_es_documents(index="some_index", action="some_action")
        )[0]

        # Neither the category not its parent should be linked to the course
        self.assertEqual(course_document["categories"], [])
        self.assertEqual(course_document["categories_names"], {})

    def test_indexers_courses_get_es_documents_unpublished_organization(self):
        """Unpublished organizations should not be indexed."""
        organization = OrganizationFactory(should_publish=True)
        CourseFactory(fill_organizations=[organization], should_publish=True)

        # Unpublish the organization
        self.assertTrue(organization.extended_object.unpublish("en"))

        course_document = list(
            CoursesIndexer.get_es_documents(index="some_index", action="some_action")
        )[0]

        # The unpublished organization should not be linked to the course
        self.assertEqual(course_document["organizations"], [])
        self.assertEqual(course_document["organizations_names"], {})

    def test_indexers_courses_get_es_documents_unpublished_person(self):
        """Unpublished persons should not be indexed."""
        person = PersonFactory(should_publish=True)
        CourseFactory(fill_team=[person], should_publish=True)

        # Unpublish the person
        self.assertTrue(person.extended_object.unpublish("en"))

        course_document = list(
            CoursesIndexer.get_es_documents(index="some_index", action="some_action")
        )[0]

        # The unpublished person should not be linked to the course
        self.assertEqual(course_document["persons"], [])
        self.assertEqual(course_document["persons_names"], {})

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
        self.assertEqual(indexed_courses[0]["_id"], course.get_es_id())

    @mock.patch(
        "richie.apps.search.indexers.courses.get_picture_info",
        return_value={"info": "picture info"},
    )
    # pylint: disable=too-many-locals
    def test_indexers_courses_get_es_documents_from_models(self, _mock_picture):
        """
        Happy path: the data is retrieved from the models properly formatted
        """
        # Create a course with a page in both english and french
        published_categories = [
            CategoryFactory(
                fill_icon=True,
                page_title={"en": "Title cat 1", "fr": "Titre cat 1"},
                should_publish=True,
            ),
            CategoryFactory(
                fill_icon=True,
                page_title={"en": "Title cat 2", "fr": "Titre cat 2"},
                should_publish=True,
            ),
        ]
        draft_category = CategoryFactory(fill_icon=True)

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

        licence1, licence2, licence3, _licence4 = LicenceFactory.create_batch(4)
        # Keep a licence unused to check that it is not returned. Link also licences to the
        # "student content licence" placeholder to check they are ignored
        licences_by_placeholders = [
            ("course_license_content", licence1),
            ("course_license_content", licence2),
            ("course_license_participation", licence2),
            ("course_license_participation", licence3),
        ]

        course = CourseFactory(
            duration=[3, WEEK],
            effort=[2, HOUR],
            fill_categories=published_categories + [draft_category],
            fill_cover=True,
            fill_icons=published_categories + [draft_category],
            fill_licences=licences_by_placeholders,
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
        )
        CourseRunFactory.create_batch(2, direct_course=course)
        course.extended_object.publish("en")
        course.extended_object.publish("fr")
        course.refresh_from_db()

        # Add a description in several languages
        placeholder = course.public_extension.extended_object.placeholders.get(
            slot="course_description"
        )
        plugin_params = {"placeholder": placeholder, "plugin_type": "CKEditorPlugin"}
        add_plugin(body="english description line 1.", language="en", **plugin_params)
        add_plugin(body="english description line 2.", language="en", **plugin_params)
        add_plugin(body="a propos français ligne 1.", language="fr", **plugin_params)
        add_plugin(body="a propos français ligne 2.", language="fr", **plugin_params)

        # Add an introduction in several languages
        placeholder = course.public_extension.extended_object.placeholders.get(
            slot="course_introduction"
        )
        plugin_params = {"placeholder": placeholder, "plugin_type": "PlainTextPlugin"}
        add_plugin(body="english introduction.", language="en", **plugin_params)
        add_plugin(body="introduction française.", language="fr", **plugin_params)

        # The results were properly formatted and passed to the consumer
        expected_course = {
            "_id": course.get_es_id(),
            "_index": "some_index",
            "_op_type": "some_action",
            "absolute_url": {
                "en": "/en/an-english-course-title/",
                "fr": "/fr/un-titre-cours-francais/",
            },
            "categories": [
                published_categories[0].get_es_id(),
                published_categories[1].get_es_id(),
            ],
            "categories_names": {
                "en": ["Title cat 1", "Title cat 2"],
                "fr": ["Titre cat 1", "Titre cat 2"],
            },
            "code": course.code,
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
                    "start": course_run.public_course_run.start,
                    "end": course_run.public_course_run.end,
                    "enrollment_start": course_run.public_course_run.enrollment_start,
                    "enrollment_end": course_run.public_course_run.enrollment_end,
                    "languages": course_run.public_course_run.languages,
                }
                for course_run in course.course_runs.order_by("-end")
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
            "effort": {"en": "2 hours", "fr": "2 heures"},
            "icon": {
                "en": {
                    "color": published_categories[0].color,
                    "info": "picture info",
                    "title": "Title cat 1",
                },
                "fr": {
                    "color": published_categories[0].color,
                    "info": "picture info",
                    "title": "Titre cat 1",
                },
            },
            "introduction": {
                "en": "english introduction.",
                "fr": "introduction française.",
            },
            "is_new": False,
            "is_listed": True,
            "licences": [licence1.id, licence2.id],
            "organization_highlighted": {
                "en": "english main organization title",
                "fr": "titre organisation principale français",
            },
            "organization_highlighted_cover_image": {},
            "organizations": [
                main_organization.get_es_id(),
                other_published_organization.get_es_id(),
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
            "persons": [
                person1.get_es_id(),
                person2.get_es_id(),
            ],
            "persons_names": {
                "en": ["Eugène Delacroix", "Comte de Saint-Germain"],
                "fr": ["Eugène Delacroix", "Earl of Saint-Germain"],
            },
            "pace": 40,
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
            effort=[36, MINUTE],
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
                    "absolute_url": {
                        "en": "/en/enhanced-incremental-circuit/",
                        "fr": "/fr/enhanced-incremental-circuit/",
                    },
                    "categories": [],
                    "categories_names": {},
                    "code": course.code,
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
                    "effort": {"en": "36 minutes", "fr": "36 minutes"},
                    "icon": {},
                    "introduction": {},
                    "is_new": False,
                    "is_listed": True,
                    "licences": [],
                    "organization_highlighted": None,
                    "organization_highlighted_cover_image": {},
                    "organizations": [],
                    "organizations_names": {},
                    "persons": [],
                    "persons_names": {},
                    "pace": 3,
                    "title": {"en": "Enhanced incremental circuit"},
                }
            ],
        )

    def test_indexers_courses_get_es_documents_is_listed(self):
        """
        Courses that are flagged to be hidden from the search page should be marked as such.
        """
        CourseFactory(should_publish=True, is_listed=False)

        indexed_courses = list(
            CoursesIndexer.get_es_documents(index="some_index", action="some_action")
        )
        self.assertEqual(len(indexed_courses), 1)
        self.assertFalse(indexed_courses[0]["is_listed"])
        self.assertIsNone(indexed_courses[0]["complete"], None)

    def test_indexers_courses_get_es_documents_no_start(self):
        """
        Course runs with no start date should not get indexed.
        """
        course = CourseFactory()
        CourseRunFactory(direct_course=course, start=None)
        course.extended_object.publish("en")

        indexed_courses = list(
            CoursesIndexer.get_es_documents(index="some_index", action="some_action")
        )
        self.assertEqual(len(indexed_courses), 1)
        self.assertEqual(indexed_courses[0]["course_runs"], [])

    def test_indexers_courses_get_es_documents_no_enrollment_start(self):
        """
        Course runs with no start of enrollment date should not get indexed.
        """
        course = CourseFactory()
        CourseRunFactory(direct_course=course, enrollment_start=None)
        course.extended_object.publish("en")

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
        course = CourseFactory()
        course_run = CourseRunFactory(direct_course=course, enrollment_end=None)
        course.extended_object.publish("en")

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
        course = CourseFactory()
        CourseRunFactory(direct_course=course, end=None)
        course.extended_object.publish("en")

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
        course = CourseFactory()
        CourseRunFactory(direct_course=course, end=None, enrollment_end=None)
        course.extended_object.publish("en")

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
            **{"page": category.extended_object},
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

    def test_indexers_courses_get_es_documents_language_fallback(self):
        """Absolute urls should be computed as expected with language fallback."""
        CourseFactory(should_publish=True, page_title={"fr": "un titre court français"})

        indexed_courses = list(
            CoursesIndexer.get_es_documents(index="some_index", action="some_action")
        )

        self.assertEqual(
            indexed_courses[0]["absolute_url"],
            {
                "en": "/en/un-titre-court-francais/",
                "fr": "/fr/un-titre-court-francais/",
            },
        )

    def test_indexers_courses_get_es_document_for_course_related_names_related_unpublished(
        self,
    ):
        """
        When related objects are unpublished in one language, that language should not be taken
        into account to build related object names.
        """
        # Create a course with related pages in both english and french but only
        # published in one language
        category = CategoryFactory(
            page_title={
                "en": "english category title",
                "fr": "titre catégorie français",
            },
            should_publish=True,
        )
        category.extended_object.unpublish("fr")

        organization = OrganizationFactory(
            page_title={
                "en": "english organization title",
                "fr": "titre organisation français",
            },
            should_publish=True,
        )
        organization.extended_object.unpublish("fr")

        person = PersonFactory(
            page_title={"en": "Brian", "fr": "François"}, should_publish=True
        )
        person.extended_object.unpublish("fr")

        course = CourseFactory(
            fill_categories=[category],
            fill_organizations=[organization],
            fill_team=[person],
            page_title={
                "en": "an english course title",
                "fr": "un titre cours français",
            },
            should_publish=True,
        )

        course_document = CoursesIndexer.get_es_document_for_course(course)
        self.assertEqual(
            course_document["organizations_names"],
            {"en": ["english organization title"]},
        )
        self.assertEqual(
            course_document["organization_highlighted"],
            {"en": "english organization title"},
        )
        self.assertEqual(
            course_document["categories_names"], {"en": ["english category title"]}
        )
        self.assertEqual(course_document["persons_names"], {"en": ["Brian"]})

    def test_indexers_courses_get_es_document_for_course_related_names_course_unpublished(
        self,
    ):
        """
        When a course is unpublished in one language, but it has related objects that are still
        published in this language, should or shouldn't we use this language's content for the
        related objects when building the course glimpse?

        This choice is controversial and I had to write these tests to fully understand it. So I
        propose to commit them to keep this memory.

        Note: We could argue in the future that a course glimpse should be built with content
        only in the same language and not with "as few fallback languages as possible, using
        available content in each language".
        """
        # Create a course with related pages in both english and french but only
        # published in one language
        category = CategoryFactory(
            page_title={
                "en": "english category title",
                "fr": "titre catégorie français",
            },
            should_publish=True,
        )

        organization_title = {
            "en": "english organization title",
            "fr": "titre organisation français",
        }
        organization = OrganizationFactory(
            page_title=organization_title, should_publish=True
        )

        person = PersonFactory(
            page_title={"en": "Brian", "fr": "François"}, should_publish=True
        )

        course = CourseFactory(
            fill_categories=[category],
            fill_organizations=[organization],
            fill_team=[person],
            page_title={
                "en": "an english course title",
                "fr": "un titre cours français",
            },
            should_publish=True,
        )
        course.extended_object.unpublish("fr")

        course_document = CoursesIndexer.get_es_document_for_course(course)

        self.assertEqual(
            course_document["organizations_names"],
            {
                "en": ["english organization title"],
                "fr": ["titre organisation français"],
            },
        )
        self.assertEqual(
            course_document["organization_highlighted"], organization_title
        )
        self.assertEqual(
            course_document["categories_names"],
            {"en": ["english category title"], "fr": ["titre catégorie français"]},
        )
        self.assertEqual(
            course_document["persons_names"], {"en": ["Brian"], "fr": ["François"]}
        )

    def test_indexers_courses_get_es_document_for_course_not_published(self):
        """
        A course indexed with no published title shoud not be listed.
        """
        course = CourseFactory(
            page_title={"en": "a course", "fr": "un cours"}, should_publish=True
        )

        course_document = CoursesIndexer.get_es_document_for_course(course)
        self.assertTrue(course_document["is_listed"])

        # Only after unpublishing all languages, the course stops being listed
        course.extended_object.unpublish("en")
        course_document = CoursesIndexer.get_es_document_for_course(course)
        self.assertTrue(course_document["is_listed"])

        course.extended_object.unpublish("fr")
        course_document = CoursesIndexer.get_es_document_for_course(course)
        self.assertFalse(course_document["is_listed"])

    # format_es_object_for_api

    def test_indexers_courses_format_es_object_for_api(self):
        """
        Make sure format_es_object_for_api returns a properly formatted course
        """
        es_course = {
            "_id": 93,
            "_source": {
                "absolute_url": {"en": "campo-qui-format-do"},
                "categories": [43, 86],
                "code": "abc123",
                "course_runs": [],
                "cover_image": {"en": "cover_image.jpg"},
                "duration": {"en": "6 months"},
                "effort": {"en": "3 hours"},
                "icon": {"en": "icon.jpg"},
                "introduction": {"en": "introductio est"},
                "organization_highlighted": {"en": "Org 84"},
                "organization_highlighted_cover_image": {"en": "org_cover_image.jpg"},
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
                "code": "abc123",
                "course_runs": [],
                "cover_image": "cover_image.jpg",
                "duration": "6 months",
                "effort": "3 hours",
                "icon": "icon.jpg",
                "introduction": "introductio est",
                "organization_highlighted": "Org 84",
                "organization_highlighted_cover_image": "org_cover_image.jpg",
                "organizations": [42, 84],
                "title": "Duis eu arcu erat",
                "state": CourseState(
                    0, datetime(2019, 3, 17, 21, 25, 52, 179667, timezone.utc)
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
                "code": "abc123",
                "course_runs": [],
                "cover_image": {"en": "cover_image.jpg"},
                "duration": {"en": "3 weeks"},
                "effort": {"en": "10 minutes"},
                "icon": {"en": "icon.jpg"},
                "introduction": {"en": "introductio est"},
                "organization_highlighted": None,
                "organization_highlighted_cover_image": {},
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
                "code": "abc123",
                "course_runs": [],
                "cover_image": "cover_image.jpg",
                "duration": "3 weeks",
                "effort": "10 minutes",
                "icon": "icon.jpg",
                "introduction": "introductio est",
                "organization_highlighted": None,
                "organization_highlighted_cover_image": None,
                "organizations": [],
                "title": "Duis eu arcu erat",
                "state": CourseState(
                    0, datetime(2019, 3, 17, 21, 25, 52, 179667, timezone.utc)
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
                "code": "abc123",
                "course_runs": [],
                "cover_image": {"en": "cover_image.jpg"},
                "duration": {"en": "N/A"},
                "effort": {"en": "N/A"},
                "icon": {},
                "introduction": {"en": "introductio est"},
                "organization_highlighted": {"en": "Org 84"},
                "organization_highlighted_cover_image": {"en": "org_cover_image.png"},
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
                "code": "abc123",
                "course_runs": [],
                "cover_image": "cover_image.jpg",
                "duration": "N/A",
                "effort": "N/A",
                "icon": None,
                "introduction": "introductio est",
                "organization_highlighted": "Org 84",
                "organization_highlighted_cover_image": "org_cover_image.png",
                "organizations": [42, 84],
                "title": "Duis eu arcu erat",
                "state": CourseState(
                    0, datetime(2019, 3, 17, 21, 25, 52, 179667, timezone.utc)
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
                "code": "abc123",
                "course_runs": [],
                "cover_image": {},
                "duration": {"en": "N/A"},
                "effort": {"en": "N/A"},
                "icon": {"en": "icon.jpg"},
                "introduction": {"en": "introductio est"},
                "organization_highlighted": {"en": "Org 42"},
                "organization_highlighted_cover_image": {},
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
                "code": "abc123",
                "course_runs": [],
                "cover_image": None,
                "duration": "N/A",
                "effort": "N/A",
                "icon": "icon.jpg",
                "introduction": "introductio est",
                "organization_highlighted": "Org 42",
                "organization_highlighted_cover_image": None,
                "organizations": [42, 84],
                "title": "Duis eu arcu erat",
                "state": CourseState(
                    0, datetime(2019, 3, 17, 21, 25, 52, 179667, timezone.utc)
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

    def test_indexers_courses_get_es_documents_catalog_visibility_hidden(
        self,
    ):
        """
        A course run with `hidden` on catalog visibility should not be indexed.
        """
        course = CourseFactory()
        CourseRunFactory(
            direct_course=course,
            catalog_visibility=CourseRunCatalogVisibility.HIDDEN,
        )
        self.assertTrue(course.extended_object.publish("en"))
        indexed_courses = list(
            CoursesIndexer.get_es_documents(index="some_index", action="some_action")
        )
        self.assertEqual(len(indexed_courses), 1)
        self.assertEqual(indexed_courses[0]["course_runs"], [])

    def test_indexers_courses_get_es_documents_catalog_visibility_course_only(
        self,
    ):
        """
        A course run with `course_only` on catalog visibility should not be indexed.
        """
        course = CourseFactory()
        CourseRunFactory(
            direct_course=course,
            catalog_visibility=CourseRunCatalogVisibility.COURSE_ONLY,
        )
        self.assertTrue(course.extended_object.publish("en"))
        indexed_courses = list(
            CoursesIndexer.get_es_documents(index="some_index", action="some_action")
        )
        self.assertEqual(len(indexed_courses), 1)
        self.assertEqual(indexed_courses[0]["course_runs"], [])

    def test_indexers_courses_get_es_documents_catalog_visibility_course_and_search(
        self,
    ):
        """
        A course run with `course_and_search` on catalog visibility should be indexed.
        """
        course = CourseFactory()
        CourseRunFactory(
            direct_course=course,
            catalog_visibility=CourseRunCatalogVisibility.COURSE_AND_SEARCH,
        )
        self.assertTrue(course.extended_object.publish("en"))
        indexed_courses = list(
            CoursesIndexer.get_es_documents(index="some_index", action="some_action")
        )
        self.assertEqual(len(indexed_courses), 1)
        self.assertEqual(len(indexed_courses[0]["course_runs"]), 1)

    def test_indexers_courses_get_es_documents_catalog_visibility_hidden_and_course_and_search(
        self,
    ):
        """
        A course with one run with `hidden` and another with `course_and_search` on catalog
        visibility should only have a single run on the index.
        """
        course = CourseFactory()
        CourseRunFactory(
            direct_course=course,
            catalog_visibility=CourseRunCatalogVisibility.HIDDEN,
        )
        CourseRunFactory(
            direct_course=course,
            catalog_visibility=CourseRunCatalogVisibility.COURSE_AND_SEARCH,
        )
        self.assertTrue(course.extended_object.publish("en"))
        indexed_courses = list(
            CoursesIndexer.get_es_documents(index="some_index", action="some_action")
        )
        self.assertEqual(len(indexed_courses), 1)
        self.assertEqual(len(indexed_courses[0]["course_runs"]), 1)

    def test_indexers_courses_get_es_documents_catalog_visibility_one_each(self):
        """
        A course with 3 runs. A run with `hidden`, another with `course_and_search` and a last
        one with `course_only` on the catalog visibility should have a single run on the index.
        """
        course = CourseFactory()
        CourseRunFactory(
            direct_course=course,
            catalog_visibility=CourseRunCatalogVisibility.HIDDEN,
        )
        CourseRunFactory(
            direct_course=course,
            catalog_visibility=CourseRunCatalogVisibility.COURSE_ONLY,
        )
        CourseRunFactory(
            direct_course=course,
            catalog_visibility=CourseRunCatalogVisibility.COURSE_AND_SEARCH,
        )
        self.assertTrue(course.extended_object.publish("en"))
        indexed_courses = list(
            CoursesIndexer.get_es_documents(index="some_index", action="some_action")
        )
        self.assertEqual(len(indexed_courses), 1)
        self.assertEqual(len(indexed_courses[0]["course_runs"]), 1)

    def test_indexers_courses_get_es_documents_course_glimpse_organization_menu_title(
        self,
    ):
        """
        Linked organizations should display the indexed acronym if the menu_title
        is filled.
        """
        menu_title = "MTO"

        organization_page = create_page(
            "My Test Organization",
            "richie/single_column.html",
            "en",
            menu_title=menu_title,
        )
        organization = OrganizationFactory(
            extended_object=organization_page, should_publish=True
        )

        course = CourseFactory(
            fill_organizations=[organization],
            should_publish=True,
        )

        course_document = CoursesIndexer.get_es_document_for_course(course)

        # The organization should display the menu title and not the title itself
        self.assertEqual(
            course_document["organization_highlighted"], {"en": menu_title}
        )
        self.assertNotEqual(
            course_document["organization_highlighted"],
            {"en": course.extended_object.get_title()},
        )

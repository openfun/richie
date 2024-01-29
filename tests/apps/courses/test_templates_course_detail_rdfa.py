"""
End-to-end tests for the course detail view
"""

import io
import re
from datetime import datetime
from unittest import mock

from django.utils import timezone

import html5lib
from cms.api import add_plugin
from cms.test_utils.testcases import CMSTestCase
from pyRdfa import pyRdfa
from rdflib.term import Literal, URIRef

from richie.apps.courses.factories import (
    CourseFactory,
    CourseRunFactory,
    LicenceFactory,
    OrganizationFactory,
    PersonFactory,
)

# pylint: disable=too-many-lines,too-many-locals,too-many-statements


class TemplatesCourseDetailRDFaCMSTestCase(CMSTestCase):
    """
    End-to-End test suite to validate the RDFa tagging in the course detail view
    """

    def test_templates_course_detail_rdfa(self):
        """
        Extract RDFa tags from the HTML markup and check that it is complete as expected.
        """
        # Create organizations
        main_organization = OrganizationFactory(
            page_title="Main org", fill_logo=True, should_publish=True
        )
        other_organization = OrganizationFactory(
            page_title="Other org", fill_logo=True, should_publish=True
        )

        # Create persons
        author1 = PersonFactory(page_title="François", fill_portrait=True)
        placeholder = author1.extended_object.placeholders.get(slot="bio")
        add_plugin(
            language="en",
            placeholder=placeholder,
            plugin_type="PlainTextPlugin",
            body="La bio de François",
        )
        author2 = PersonFactory(
            page_title="Jeanne", fill_portrait=True, should_publish=True
        )

        # Create a course with cover image, team and organizations
        licence_content, licence_participation = LicenceFactory.create_batch(2)
        course = CourseFactory(
            code="abcde",
            effort=[3, "hour"],
            page_title="Very interesting course",
            fill_cover=True,
            fill_organizations=[main_organization, other_organization],
            fill_team=[author1, author2],
            fill_licences=[
                ("course_license_content", licence_content),
                ("course_license_participation", licence_participation),
            ],
        )

        # Add an introduction to the course
        placeholder = course.extended_object.placeholders.get(
            slot="course_introduction"
        )
        add_plugin(
            language="en",
            placeholder=placeholder,
            plugin_type="PlainTextPlugin",
            body="Introduction to interesting course",
        )

        # Create an ongoing open course run that will be published (created before
        # publishing the page)
        now = datetime(2030, 6, 15, tzinfo=timezone.utc)
        CourseRunFactory(
            direct_course=course,
            start=datetime(2030, 6, 30, tzinfo=timezone.utc),
            end=datetime(2030, 8, 1, tzinfo=timezone.utc),
            enrollment_start=datetime(2030, 6, 14, tzinfo=timezone.utc),
            enrollment_end=datetime(2030, 6, 16, tzinfo=timezone.utc),
            languages=["en", "fr"],
        )
        CourseRunFactory(
            direct_course=course,
            start=datetime(2030, 6, 1, tzinfo=timezone.utc),
            end=datetime(2030, 7, 10, tzinfo=timezone.utc),
            enrollment_start=datetime(2030, 6, 13, tzinfo=timezone.utc),
            enrollment_end=datetime(2030, 6, 20, tzinfo=timezone.utc),
            languages=["de"],
        )

        author1.extended_object.publish("en")
        course.extended_object.publish("en")

        url = course.extended_object.get_absolute_url()
        with mock.patch.object(timezone, "now", return_value=now):
            response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        processor = pyRdfa()
        content = str(response.content)
        parser = html5lib.HTMLParser(tree=html5lib.treebuilders.getTreeBuilder("dom"))
        dom = parser.parse(io.StringIO(content))
        graph = processor.graph_from_DOM(dom)

        # Retrieve the course top node (body)
        (subject,) = graph.subjects(
            URIRef("http://www.w3.org/1999/02/22-rdf-syntax-ns#type"),
            URIRef("https://schema.org/Course"),
        )
        self.assertEqual(len(list(graph.triples((subject, None, None)))), 37)

        # Opengraph
        self.assertTrue(
            (
                subject,
                URIRef("http://ogp.me/ns#url"),
                Literal("http://example.com/en/very-interesting-course/"),
            )
            in graph
        )
        self.assertTrue(
            (subject, URIRef("http://ogp.me/ns#site_name"), Literal("example.com"))
            in graph
        )
        self.assertTrue(
            (subject, URIRef("http://ogp.me/ns#type"), Literal("website")) in graph
        )
        self.assertTrue(
            (subject, URIRef("http://ogp.me/ns#locale"), Literal("en")) in graph
        )
        self.assertTrue(
            (subject, URIRef("http://ogp.me/ns#determiner"), Literal("")) in graph
        )
        self.assertTrue(
            (
                subject,
                URIRef("http://ogp.me/ns#title"),
                Literal("Very interesting course"),
            )
            in graph
        )
        self.assertTrue(
            (
                subject,
                URIRef("http://ogp.me/ns#description"),
                Literal("Introduction to interesting course"),
            )
            in graph
        )

        (image_value,) = graph.objects(subject, URIRef("http://ogp.me/ns#image"))
        pattern = (
            r"/media/filer_public_thumbnails/filer_public/.*cover\.jpg__"
            r"1200x630_q85_crop_replace_alpha-%23FFFFFF_subject_location"
        )
        self.assertIsNotNone(re.search(pattern, str(image_value)))

        # Schema.org
        # - Course
        self.assertTrue(
            (
                subject,
                URIRef("http://www.w3.org/1999/02/22-rdf-syntax-ns#type"),
                URIRef("https://schema.org/Course"),
            )
            in graph
        )
        self.assertTrue(
            (
                subject,
                URIRef("https://schema.org/name"),
                Literal("Very interesting course"),
            )
            in graph
        )
        self.assertTrue(
            (
                subject,
                URIRef("https://schema.org/description"),
                Literal("Introduction to interesting course"),
            )
            in graph
        )
        self.assertTrue(
            (subject, URIRef("https://schema.org/courseCode"), Literal("ABCDE"))
            in graph
        )
        self.assertTrue(
            (subject, URIRef("https://schema.org/timeRequired"), Literal("PT3H"))
            in graph
        )
        self.assertTrue(
            (
                subject,
                URIRef("https://schema.org/stylesheet"),
                URIRef("/static/richie/css/main.css"),
            )
            in graph
        )
        self.assertTrue(
            (
                subject,
                URIRef("https://schema.org/shortcut"),
                URIRef("/static/richie/favicon/favicon.ico"),
            )
            in graph
        )
        self.assertTrue(
            (
                subject,
                URIRef("https://schema.org/icon"),
                URIRef("/static/richie/favicon/favicon.ico"),
            )
            in graph
        )
        self.assertTrue(
            (
                subject,
                URIRef("https://schema.org/icon"),
                URIRef("/static/richie/favicon/favicon-16x16.png"),
            )
            in graph
        )
        self.assertTrue(
            (
                subject,
                URIRef("https://schema.org/icon"),
                URIRef("/static/richie/favicon/favicon-32x32.png"),
            )
            in graph
        )
        self.assertTrue(
            (
                subject,
                URIRef("https://schema.org/apple-touch-icon"),
                URIRef("/static/richie/favicon/apple-touch-icon.png"),
            )
            in graph
        )
        self.assertTrue(
            (
                subject,
                URIRef("https://schema.org/mask-icon"),
                URIRef("/static/richie/favicon/safari-pinned-tab.svg"),
            )
            in graph
        )
        self.assertTrue(
            (
                subject,
                URIRef("https://schema.org/manifest"),
                URIRef("/static/richie/favicon/site.webmanifest"),
            )
            in graph
        )
        self.assertTrue(
            (
                subject,
                URIRef("https://schema.org/noreferrer"),
                URIRef("https://www.facebook.com/example"),
            )
            in graph
        )
        self.assertTrue(
            (
                subject,
                URIRef("https://schema.org/noopener"),
                URIRef("https://www.facebook.com/example"),
            )
            in graph
        )
        self.assertTrue(
            (
                subject,
                URIRef("https://schema.org/alternate"),
                URIRef("http://example.com/en/very-interesting-course/"),
            )
            in graph
        )
        self.assertTrue(
            (
                subject,
                URIRef("https://schema.org/alternate"),
                URIRef("http://example.com/fr/very-interesting-course/"),
            )
            in graph
        )

        (image_value,) = graph.objects(subject, URIRef("https://schema.org/image"))
        pattern = (
            r"/media/filer_public_thumbnails/filer_public/.*cover\.jpg__"
            r"300x170_q85_crop_replace_alpha-%23FFFFFF_subject_location"
        )
        self.assertIsNotNone(re.search(pattern, str(image_value)))

        self.assertTrue(
            (subject, URIRef("https://schema.org/license"), URIRef(licence_content.url))
            in graph
        )
        self.assertTrue(
            (
                None,
                URIRef("https://schema.org/license"),
                URIRef(licence_participation.url),
            )
            not in graph
        )
        # - Main organization (Provider)
        self.assertTrue(
            (subject, URIRef("https://schema.org/provider"), URIRef("/en/main-org/"))
            in graph
        )
        self.assertTrue(
            (
                URIRef("/en/main-org/"),
                URIRef("https://schema.org/name"),
                Literal("Main org"),
            )
            in graph
        )
        self.assertTrue(
            (
                URIRef("/en/main-org/"),
                URIRef("https://schema.org/url"),
                Literal("http://example.com/en/main-org/"),
            )
            in graph
        )

        (logo_value,) = graph.objects(
            URIRef("/en/main-org/"), URIRef("https://schema.org/logo")
        )
        pattern = (
            r"/media/filer_public_thumbnails/filer_public/.*logo.jpg__"
            r"200x113_q85_replace_alpha-%23FFFFFF_subject_location"
        )
        self.assertIsNotNone(re.search(pattern, str(logo_value)))

        # - Organizations (Contributor)
        contributor_subjects = list(
            graph.objects(subject, URIRef("https://schema.org/contributor"))
        )
        self.assertEqual(len(contributor_subjects), 2)

        self.assertTrue(
            (
                contributor_subjects[0],
                URIRef("http://www.w3.org/1999/02/22-rdf-syntax-ns#type"),
                URIRef("https://schema.org/CollegeOrUniversity"),
            )
            in graph
        )
        self.assertTrue(
            (
                contributor_subjects[1],
                URIRef("http://www.w3.org/1999/02/22-rdf-syntax-ns#type"),
                URIRef("https://schema.org/CollegeOrUniversity"),
            )
            in graph
        )

        self.assertTrue(
            (
                URIRef("/en/main-org/"),
                URIRef("https://schema.org/name"),
                Literal("Main org"),
            )
            in graph
        )

        self.assertTrue(
            (
                URIRef("/en/other-org/"),
                URIRef("https://schema.org/name"),
                Literal("Other org"),
            )
            in graph
        )

        self.assertTrue(
            (
                URIRef("/en/main-org/"),
                URIRef("https://schema.org/url"),
                Literal("http://example.com/en/main-org/"),
            )
            in graph
        )

        self.assertTrue(
            (
                URIRef("/en/other-org/"),
                URIRef("https://schema.org/url"),
                Literal("http://example.com/en/other-org/"),
            )
            in graph
        )

        pattern = (
            r"/media/filer_public_thumbnails/filer_public/.*logo.jpg__"
            r"200x113_q85_replace_alpha-%23FFFFFF_subject_location"
        )
        (logo_value,) = graph.objects(
            URIRef("/en/main-org/"), URIRef("https://schema.org/logo")
        )
        self.assertIsNotNone(re.search(pattern, str(logo_value)))

        (logo_value,) = graph.objects(
            URIRef("/en/other-org/"), URIRef("https://schema.org/logo")
        )
        self.assertIsNotNone(re.search(pattern, str(logo_value)))

        # - Team (Person)
        author_subjects = list(
            graph.objects(subject, URIRef("https://schema.org/author"))
        )
        self.assertEqual(len(author_subjects), 2)

        self.assertTrue(
            (
                author_subjects[0],
                URIRef("http://www.w3.org/1999/02/22-rdf-syntax-ns#type"),
                URIRef("https://schema.org/Person"),
            )
            in graph
        )
        self.assertTrue(
            (
                author_subjects[1],
                URIRef("http://www.w3.org/1999/02/22-rdf-syntax-ns#type"),
                URIRef("https://schema.org/Person"),
            )
            in graph
        )

        for name in ["Fran\\xc3\\xa7ois", "Jeanne"]:
            (author_subject,) = graph.subjects(
                URIRef("https://schema.org/name"), Literal(name)
            )
            self.assertTrue(author_subject in author_subjects)

        (author_subject,) = graph.subjects(
            URIRef("https://schema.org/description"),
            Literal("La bio de Fran\\xc3\\xa7ois"),
        )
        self.assertTrue(author_subject in author_subjects)

        for url in ["http://example.com/en/francois/", "http://example.com/en/jeanne/"]:
            (author_subject,) = graph.subjects(
                URIRef("https://schema.org/url"), Literal(url)
            )
            self.assertTrue(author_subject in author_subjects)

        pattern = (
            r"/media/filer_public_thumbnails/filer_public/.*portrait.jpg__"
            r"200x200_q85_crop_replace_alpha-%23FFFFFF_subject_location"
        )
        for author_subject in author_subjects:
            (portrait_value,) = graph.objects(
                author_subject, URIRef("https://schema.org/image")
            )
            self.assertIsNotNone(re.search(pattern, str(portrait_value)))

        # - Course runs (CourseInstance)
        course_run_subjects = list(
            graph.objects(subject, URIRef("https://schema.org/hasCourseInstance"))
        )
        self.assertEqual(len(course_run_subjects), 2)

        self.assertTrue(
            (
                course_run_subjects[0],
                URIRef("http://www.w3.org/1999/02/22-rdf-syntax-ns#type"),
                URIRef("https://schema.org/CourseInstance"),
            )
            in graph
        )
        self.assertTrue(
            (
                course_run_subjects[0],
                URIRef("https://schema.org/courseMode"),
                Literal("online"),
            )
            in graph
        )
        self.assertTrue(
            (
                course_run_subjects[1],
                URIRef("http://www.w3.org/1999/02/22-rdf-syntax-ns#type"),
                URIRef("https://schema.org/CourseInstance"),
            )
            in graph
        )
        self.assertTrue(
            (
                course_run_subjects[1],
                URIRef("https://schema.org/courseMode"),
                Literal("online"),
            )
            in graph
        )

        for start_date in ["2030-06-01", "2030-06-30"]:
            (subject,) = graph.subjects(
                URIRef("https://schema.org/startDate"), Literal(start_date)
            )
            self.assertTrue(subject in course_run_subjects)

        for end_date in ["2030-07-10", "2030-08-01"]:
            (subject,) = graph.subjects(
                URIRef("https://schema.org/endDate"), Literal(end_date)
            )
            self.assertTrue(subject in course_run_subjects)

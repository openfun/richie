"""
End-to-end tests for the course detail view
"""

import io
import re
from datetime import datetime
from unittest import mock

from django.template.defaultfilters import striptags
from django.utils import timezone

import html5lib
from cms.api import add_plugin
from cms.test_utils.testcases import CMSTestCase
from pyRdfa import pyRdfa
from rdflib.namespace import RDF, SDO
from rdflib.term import Literal, URIRef

from richie.apps.courses.factories import (
    CategoryFactory,
    CourseFactory,
    CourseRunFactory,
    LicenceFactory,
    OrganizationFactory,
    PersonFactory,
)
from richie.apps.courses.models import CourseRunCatalogVisibility
from richie.plugins.nesteditem.defaults import ACCORDION

# pylint: disable=too-many-lines,too-many-locals,too-many-statements


class TemplatesCourseDetailRDFaCMSTestCase(CMSTestCase):
    """
    End-to-End test suite to validate the RDFa tagging in the course detail view
    """

    # pylint: disable=too-many-branches
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
        contributor1 = PersonFactory(page_title="François", fill_portrait=True)
        placeholder = contributor1.extended_object.placeholders.get(slot="bio")
        add_plugin(
            language="en",
            placeholder=placeholder,
            plugin_type="PlainTextPlugin",
            body="La bio de François",
        )
        contributor2 = PersonFactory(
            page_title="Jeanne", fill_portrait=True, should_publish=True
        )

        category1 = CategoryFactory.create(page_title="Accessible", should_publish=True)
        category2 = CategoryFactory.create(
            page_title="Earth and universe sciences", should_publish=True
        )

        # Create a course with cover image, team and organizations
        licence_content, licence_participation = LicenceFactory.create_batch(2)
        course = CourseFactory(
            code="abcde",
            effort=[3, "hour"],
            page_title="Very interesting course",
            fill_cover=True,
            fill_organizations=[main_organization, other_organization],
            fill_team=[contributor1, contributor2],
            fill_licences=[
                ("course_license_content", licence_content),
                ("course_license_participation", licence_participation),
            ],
            fill_categories=[category1, category2],
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

        # Add a description to the course
        placeholder = course.extended_object.placeholders.get(slot="course_description")
        add_plugin(
            language="en",
            placeholder=placeholder,
            plugin_type="CKEditorPlugin",
            body="Description to interesting course",
        )

        # Add course skills
        placeholder = course.extended_object.placeholders.get(slot="course_skills")
        add_plugin(
            language="en",
            placeholder=placeholder,
            plugin_type="CKEditorPlugin",
            body="Skill 1, Skill 2",
        )

        # Add course format
        placeholder = course.extended_object.placeholders.get(slot="course_format")
        add_plugin(
            language="en",
            placeholder=placeholder,
            plugin_type="CKEditorPlugin",
            body="3 modules of 4 hours",
        )

        # Add course prerequisites
        placeholder = course.extended_object.placeholders.get(
            slot="course_prerequisites"
        )
        add_plugin(
            language="en",
            placeholder=placeholder,
            plugin_type="CKEditorPlugin",
            body="Skill 0",
        )

        # Add course assessment
        placeholder = course.extended_object.placeholders.get(slot="course_assessment")
        add_plugin(
            language="en",
            placeholder=placeholder,
            plugin_type="CKEditorPlugin",
            body="A valuable certificate",
        )

        # Add a course plan
        placeholder = course.extended_object.placeholders.get(slot="course_plan")
        container = add_plugin(
            language="en",
            placeholder=placeholder,
            plugin_type="NestedItemPlugin",
            variant=ACCORDION,
        )
        for week in range(1, 3):
            week_container = add_plugin(
                language="en",
                placeholder=placeholder,
                plugin_type="NestedItemPlugin",
                target=container,
                content=f"Week {week}",
                variant=ACCORDION,
            )

            for chapter in range(1, 3):
                add_plugin(
                    language="en",
                    placeholder=placeholder,
                    plugin_type="NestedItemPlugin",
                    target=week_container,
                    content=f"Chapter {week}-{chapter}",
                    variant=ACCORDION,
                )

        # Add required equipment
        placeholder = course.extended_object.placeholders.get(
            slot="course_required_equipment"
        )
        add_plugin(
            language="en",
            placeholder=placeholder,
            plugin_type="PlainTextPlugin",
            body="Required equipment section content",
        )

        # Add accessibility
        placeholder = course.extended_object.placeholders.get(
            slot="course_accessibility"
        )
        add_plugin(
            language="en",
            placeholder=placeholder,
            plugin_type="PlainTextPlugin",
            body="Accessibility section content",
        )

        # Create an ongoing open course run that will be published (created before
        # publishing the page)
        now = datetime(2030, 6, 15, tzinfo=timezone.utc)
        CourseRunFactory(
            title="Run 0",
            direct_course=course,
            start=datetime(2030, 6, 30, tzinfo=timezone.utc),
            end=datetime(2030, 8, 1, tzinfo=timezone.utc),
            enrollment_start=datetime(2030, 6, 14, tzinfo=timezone.utc),
            enrollment_end=datetime(2030, 6, 16, tzinfo=timezone.utc),
            languages=["en", "fr"],
            enrollment_count=5000,
        )
        CourseRunFactory(
            title="Run 1",
            direct_course=course,
            start=datetime(2030, 6, 1, tzinfo=timezone.utc),
            end=datetime(2030, 7, 10, tzinfo=timezone.utc),
            enrollment_start=datetime(2030, 6, 13, tzinfo=timezone.utc),
            enrollment_end=datetime(2030, 6, 20, tzinfo=timezone.utc),
            languages=["de"],
            enrollment_count=3000,
        )
        CourseRunFactory(
            title="A hidden course run",
            direct_course=course,
            start=datetime(2010, 6, 1, tzinfo=timezone.utc),
            end=datetime(2050, 7, 10, tzinfo=timezone.utc),
            enrollment_start=datetime(2010, 6, 13, tzinfo=timezone.utc),
            enrollment_end=datetime(2050, 6, 20, tzinfo=timezone.utc),
            languages=["pt"],
            enrollment_count=100,
            catalog_visibility=CourseRunCatalogVisibility.HIDDEN,
        )
        CourseRunFactory(
            title="A to be scheduled run",
            direct_course=course,
            start=None,
            end=None,
            enrollment_start=None,
            enrollment_end=None,
            languages=["en"],
            enrollment_count=0,
        )

        contributor1.extended_object.publish("en")
        course.extended_object.publish("en")

        url = course.extended_object.get_absolute_url()
        with mock.patch.object(timezone, "now", return_value=now):
            response = self.client.get(url)

        self.assertEqual(response.status_code, 200)

        processor = pyRdfa()
        content = str(response.content.decode("utf-8"))
        parser = html5lib.HTMLParser(tree=html5lib.treebuilders.getTreeBuilder("dom"))
        dom = parser.parse(io.StringIO(content))
        graph = processor.graph_from_DOM(dom)

        # Retrieve the course top node (body)
        (subject,) = graph.subjects(RDF.type, SDO.Course, unique=True)

        self.assertEqual(len(list(graph.triples((subject, None, None)))), 41)

        # Opengraph
        self.assertTrue(
            (
                None,
                URIRef("http://ogp.me/ns#url"),
                Literal("http://example.com/en/very-interesting-course/"),
            )
            in graph
        )
        self.assertTrue(
            (None, URIRef("http://ogp.me/ns#site_name"), Literal("example.com"))
            in graph
        )
        self.assertTrue(
            (None, URIRef("http://ogp.me/ns#type"), Literal("website")) in graph
        )
        self.assertTrue(
            (None, URIRef("http://ogp.me/ns#locale"), Literal("en")) in graph
        )
        self.assertTrue(
            (None, URIRef("http://ogp.me/ns#determiner"), Literal("")) in graph
        )
        self.assertTrue(
            (
                None,
                URIRef("http://ogp.me/ns#title"),
                Literal("Very interesting course"),
            )
            in graph
        )
        self.assertTrue(
            (
                None,
                URIRef("http://ogp.me/ns#description"),
                Literal("Introduction to interesting course"),
            )
            in graph
        )

        (image_value,) = graph.objects(None, URIRef("http://ogp.me/ns#image"))
        pattern = (
            r"/media/filer_public_thumbnails/filer_public/.*cover\.jpg__"
            r"1200x630_q85_crop_replace_alpha-%23FFFFFF_subject_location"
        )
        self.assertIsNotNone(re.search(pattern, str(image_value)))

        # Schema.org
        # - Course
        self.assertTrue((subject, RDF.type, SDO.Course) in graph)
        self.assertTrue(
            (subject, SDO.name, Literal("Very interesting course")) in graph
        )
        self.assertTrue(
            (subject, SDO.abstract, Literal("Introduction to interesting course"))
            in graph
        )
        self.assertTrue(
            (subject, SDO.availableLanguage, Literal("English, french and german"))
            in graph
        )
        self.assertTrue((subject, SDO.courseCode, Literal("ABCDE")) in graph)
        self.assertTrue((subject, SDO.timeRequired, Literal("PT3H")) in graph)
        self.assertTrue(
            (subject, SDO.totalHistoricalEnrollment, Literal("8000")) in graph
        )

        (image_value,) = graph.objects(subject, SDO.image)
        pattern = (
            r"/media/filer_public_thumbnails/filer_public/.*cover\.jpg__"
            r"300x170_q85_crop_replace_alpha-%23FFFFFF_subject_location"
        )
        self.assertIsNotNone(re.search(pattern, str(image_value)))

        (description_value,) = graph.objects(subject, SDO.description)
        pattern = r"Description to interesting course"
        self.assertIsNotNone(re.search(pattern, str(description_value)))

        (prerequisites_value,) = graph.objects(subject, SDO.coursePrerequisites)
        pattern = r"Skill 0"
        self.assertIsNotNone(re.search(pattern, str(prerequisites_value)))

        (assessment_value,) = graph.objects(subject, SDO.educationalCredentialAwarded)
        pattern = r"A valuable certificate"
        self.assertIsNotNone(re.search(pattern, str(assessment_value)))

        (accessibility_value,) = graph.objects(subject, SDO.accessibilitySummary)
        pattern = r"Accessibility section content"
        self.assertIsNotNone(re.search(pattern, str(accessibility_value)))

        abouts = list(graph.objects(subject, SDO.about))
        self.assertEqual(len(abouts), 3)

        (format_subject,) = graph.subjects(SDO.name, Literal("Format"))
        self.assertTrue((subject, SDO.about, format_subject) in graph)
        self.assertTrue((format_subject, RDF.type, SDO.Thing) in graph)
        (description_value,) = graph.objects(format_subject, SDO.description)
        pattern = r"3 modules of 4 hours"
        self.assertIsNotNone(re.search(pattern, str(description_value)))

        (skills_subject,) = graph.subjects(SDO.name, Literal("What you will learn"))
        self.assertTrue((subject, SDO.about, skills_subject) in graph)
        self.assertTrue((skills_subject, RDF.type, SDO.Thing) in graph)
        (description_value,) = graph.objects(skills_subject, SDO.description)
        pattern = r"Skill 1, Skill 2"
        self.assertIsNotNone(re.search(pattern, str(description_value)))

        (required_equipment_subject,) = graph.subjects(
            SDO.name, Literal("Required Equipment")
        )
        self.assertTrue((subject, SDO.about, required_equipment_subject) in graph)
        self.assertTrue((required_equipment_subject, RDF.type, SDO.Thing) in graph)
        (description_value,) = graph.objects(
            required_equipment_subject, SDO.description
        )
        pattern = r"Required equipment section content"
        self.assertIsNotNone(re.search(pattern, str(description_value)))

        self.assertTrue((subject, SDO.about, format_subject) in graph)
        self.assertTrue((format_subject, RDF.type, SDO.Thing) in graph)

        sections = list(graph.objects(subject, SDO.syllabusSections))
        self.assertEqual(len(sections), 1)

        syllabus = list(graph.triples((None, RDF.type, SDO.Syllabus)))
        # SyllabusSections should be composed of 7 Syllabus nested children
        self.assertEqual(len(syllabus), 7)

        # The root syllabus should have 2 parts
        week_parts = list(graph.objects(sections[0], SDO.hasPart))
        self.assertEqual(len(week_parts), 2)

        # There should be a first nesting level of Syllabus
        for index, name in enumerate(["Week 1", "Week 2"]):
            # The Syllabus should have a name
            (part_subject,) = graph.subjects(SDO.name, Literal(name))
            self.assertTrue(part_subject in week_parts)
            # The Syllabus should have a position
            (position,) = graph.objects(part_subject, SDO.position)
            self.assertEqual(position, Literal(str(index)))

            # The Syllabus parts should have two parts
            chapter_parts = list(graph.objects(part_subject, SDO.hasPart))
            self.assertEqual(len(chapter_parts), 2)

            # There should be a second nesting level of Syllabus
            for index, name in enumerate(
                [f"Chapter {index+1}-1", f"Chapter {index+1}-2"]
            ):
                # The Syllabus should have a name
                (part_subject,) = graph.subjects(SDO.name, Literal(name))
                self.assertTrue(part_subject in chapter_parts)
                # The Syllabus should have a position
                (position,) = graph.objects(part_subject, SDO.position)
                self.assertEqual(position, Literal(str(index)))

                # There should be no third nesting level of Syllabus
                parts = list(graph.objects(part_subject, SDO.hasPart))
                self.assertEqual(len(parts), 0)

        # - Licenses
        licences = list(graph.objects(subject, SDO.license))
        self.assertEqual(len(licences), 1)
        licence = licences[0]

        self.assertTrue((licence, SDO.name, Literal(licence_content.name)) in graph)
        self.assertTrue(
            (licence, SDO.abstract, Literal(striptags(licence_content.content)))
            in graph
        )
        self.assertTrue((licence, SDO.url, Literal(licence_content.url)) in graph)
        self.assertTrue((None, SDO.url, URIRef(licence_participation.url)) not in graph)

        (thumbnail_value,) = graph.objects(licence, SDO.thumbnailUrl)
        pattern = (
            r"/media/filer_public_thumbnails/filer_public/.*/example.jpg__"
            r"100x50_q85_crop-smart_replace_alpha-%23FFFFFF_subsampling-2.jpg"
        )
        self.assertIsNotNone(re.search(pattern, str(thumbnail_value)))

        # - Main organization (Provider)
        self.assertTrue((subject, SDO.provider, URIRef("/en/main-org/")) in graph)
        self.assertTrue(
            (URIRef("/en/main-org/"), SDO.name, Literal("Main org")) in graph
        )
        self.assertTrue(
            (
                URIRef("/en/main-org/"),
                SDO.url,
                Literal("http://example.com/en/main-org/"),
            )
            in graph
        )

        (logo_value,) = graph.objects(URIRef("/en/main-org/"), SDO.logo)
        pattern = (
            r"/media/filer_public_thumbnails/filer_public/.*logo.jpg__"
            r"200x113_q85_replace_alpha-%23FFFFFF_subject_location"
        )
        self.assertIsNotNone(re.search(pattern, str(logo_value)))

        # - Organizations (Author)
        author_subjects = list(graph.objects(subject, SDO.author))
        self.assertEqual(len(author_subjects), 2)

        self.assertTrue(
            (
                author_subjects[0],
                RDF.type,
                SDO.CollegeOrUniversity,
            )
            in graph
        )
        self.assertTrue(
            (
                author_subjects[1],
                RDF.type,
                SDO.CollegeOrUniversity,
            )
            in graph
        )

        self.assertTrue(
            (
                URIRef("/en/main-org/"),
                SDO.name,
                Literal("Main org"),
            )
            in graph
        )

        self.assertTrue(
            (
                URIRef("/en/other-org/"),
                SDO.name,
                Literal("Other org"),
            )
            in graph
        )

        self.assertTrue(
            (
                URIRef("/en/main-org/"),
                SDO.url,
                Literal("http://example.com/en/main-org/"),
            )
            in graph
        )

        self.assertTrue(
            (
                URIRef("/en/other-org/"),
                SDO.url,
                Literal("http://example.com/en/other-org/"),
            )
            in graph
        )

        pattern = (
            r"/media/filer_public_thumbnails/filer_public/.*logo.jpg__"
            r"200x113_q85_replace_alpha-%23FFFFFF_subject_location"
        )
        (logo_value,) = graph.objects(URIRef("/en/main-org/"), SDO.logo)
        self.assertIsNotNone(re.search(pattern, str(logo_value)))

        (logo_value,) = graph.objects(URIRef("/en/other-org/"), SDO.logo)
        self.assertIsNotNone(re.search(pattern, str(logo_value)))

        # - Team (Person)
        contributor_subjects = list(graph.objects(subject, SDO.contributor))
        self.assertEqual(len(contributor_subjects), 2)
        self.assertTrue(
            (
                contributor_subjects[0],
                RDF.type,
                SDO.Person,
            )
            in graph
        )
        self.assertTrue(
            (
                contributor_subjects[1],
                RDF.type,
                SDO.Person,
            )
            in graph
        )

        for name in ["François", "Jeanne"]:
            (contributor_subject,) = graph.subjects(SDO.name, Literal(name))
            self.assertTrue(contributor_subject in contributor_subjects)

        (contributor_subject,) = graph.subjects(
            SDO.description,
            Literal("La bio de François"),
        )
        self.assertTrue(contributor_subject in contributor_subjects)

        for url in ["http://example.com/en/francois/", "http://example.com/en/jeanne/"]:
            (contributor_subject,) = graph.subjects(SDO.url, Literal(url))
            self.assertTrue(contributor_subject in contributor_subjects)

        pattern = (
            r"/media/filer_public_thumbnails/filer_public/.*portrait.jpg__"
            r"200x200_q85_crop_replace_alpha-%23FFFFFF_subject_location"
        )
        for contributor_subject in contributor_subjects:
            (portrait_value,) = graph.objects(contributor_subject, SDO.image)
            self.assertIsNotNone(re.search(pattern, str(portrait_value)))

        # - Course runs (CourseInstance)
        course_run_subjects = list(graph.objects(subject, SDO.hasCourseInstance))
        self.assertEqual(len(course_run_subjects), 2)

        for course_run_subject in course_run_subjects:
            self.assertTrue((course_run_subject, RDF.type, SDO.CourseInstance) in graph)
            self.assertTrue(
                (course_run_subject, SDO.courseMode, Literal("online")) in graph
            )
            self.assertTrue(
                (course_run_subject, SDO.courseWorkload, Literal("PT3H")) in graph
            )

        for title in ["Run 0", "Run 1"]:
            (course_run_subject,) = graph.subjects(SDO.name, Literal(title))
            self.assertTrue(course_run_subject in course_run_subjects)

        for language in ["English and french", "German"]:
            (course_run_subject,) = graph.subjects(SDO.inLanguage, Literal(language))
            self.assertTrue(course_run_subject in course_run_subjects)

        for start_date in ["2030-06-01", "2030-06-30"]:
            (course_run_subject,) = graph.subjects(SDO.startDate, Literal(start_date))
            self.assertTrue(course_run_subject in course_run_subjects)

        for end_date in ["2030-07-10", "2030-08-01"]:
            (course_run_subject,) = graph.subjects(SDO.endDate, Literal(end_date))
            self.assertTrue(course_run_subject in course_run_subjects)

        # Categories (keywords)
        category_subjects = list(graph.objects(subject, SDO.keywords))
        self.assertEqual(len(category_subjects), 2)

        self.assertTrue((category_subjects[0], RDF.type, SDO.DefinedTerm) in graph)
        self.assertTrue((category_subjects[1], RDF.type, SDO.DefinedTerm) in graph)

        for category in [category1, category2]:
            page_title = category.extended_object.get_title()
            page_url = category.extended_object.get_absolute_url()

            (category_subject,) = graph.subjects(SDO.name, Literal(page_title))
            self.assertTrue(category_subject in category_subjects)

            (category_subject,) = graph.subjects(SDO.url, Literal(page_url))
            self.assertTrue(category_subject in category_subjects)

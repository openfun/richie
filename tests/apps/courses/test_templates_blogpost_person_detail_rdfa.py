"""
End-to-end tests for the RDFa tagging of the blog post and person detail views
"""

import io

import html5lib
from cms.test_utils.testcases import CMSTestCase
from pyRdfa import pyRdfa
from rdflib.namespace import RDF, SDO
from rdflib.term import Literal

from richie.apps.courses.factories import (
    BlogPostFactory,
    OrganizationFactory,
    PersonFactory,
)


def get_graph(content):
    """Extract the RDFa graph from an HTML response content."""
    processor = pyRdfa()
    parser = html5lib.HTMLParser(tree=html5lib.treebuilders.getTreeBuilder("dom"))
    dom = parser.parse(io.StringIO(str(content.decode("utf-8"))))
    return processor.graph_from_DOM(dom)


class TemplatesBlogPostPersonDetailRDFaCMSTestCase(CMSTestCase):
    """
    End-to-End test suite to validate the RDFa tagging in the blog post and person detail views
    """

    def test_templates_blogpost_detail_rdfa(self):
        """The blog post is an Article with headline, dates, image, description and author."""
        person = PersonFactory(page_title="Ada Lovelace", should_publish=True)
        blogpost = BlogPostFactory(
            page_title="Preums",
            fill_cover=True,
            fill_excerpt=True,
            fill_author=[person],
            should_publish=True,
        )

        response = self.client.get(blogpost.extended_object.get_absolute_url())
        self.assertEqual(response.status_code, 200)
        graph = get_graph(response.content)

        (subject,) = graph.subjects(RDF.type, SDO.Article, unique=True)
        self.assertTrue((subject, SDO.headline, Literal("Preums")) in graph)
        self.assertTrue((subject, SDO.inLanguage, Literal("en")) in graph)
        self.assertEqual(len(list(graph.objects(subject, SDO.datePublished))), 1)
        self.assertEqual(len(list(graph.objects(subject, SDO.dateModified))), 1)
        self.assertEqual(len(list(graph.objects(subject, SDO.image))), 1)
        self.assertEqual(len(list(graph.objects(subject, SDO.description))), 1)

        (author_subject,) = graph.objects(subject, SDO.author)
        self.assertTrue((author_subject, RDF.type, SDO.Person) in graph)
        self.assertTrue((author_subject, SDO.name, Literal("Ada Lovelace")) in graph)
        self.assertTrue(
            (author_subject, SDO.url, Literal("http://example.com/en/ada-lovelace/"))
            in graph
        )

    def test_templates_person_detail_rdfa(self):
        """The person is a Person with a name, a url and organizations as affiliation."""
        organization = OrganizationFactory(page_title="Main org", should_publish=True)
        person = PersonFactory(
            page_title="Ada Lovelace",
            fill_organizations=[organization],
            should_publish=True,
        )

        response = self.client.get(person.extended_object.get_absolute_url())
        self.assertEqual(response.status_code, 200)
        graph = get_graph(response.content)

        (subject,) = graph.subjects(RDF.type, SDO.Person, unique=True)
        self.assertTrue((subject, SDO.name, Literal("Ada Lovelace")) in graph)
        self.assertTrue(
            (subject, SDO.url, Literal("http://example.com/en/ada-lovelace/")) in graph
        )
        (affiliation_subject,) = graph.objects(subject, SDO.affiliation)
        self.assertTrue(
            (affiliation_subject, RDF.type, SDO.CollegeOrUniversity) in graph
        )
        self.assertTrue((affiliation_subject, SDO.name, Literal("Main org")) in graph)
        self.assertEqual(list(graph.objects(subject, SDO.author)), [])

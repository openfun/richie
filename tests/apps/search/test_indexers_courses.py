"""
Tests for the course indexer
"""
# pylint: disable=too-many-lines
import json
from types import SimpleNamespace
from unittest import mock

from django.http.request import QueryDict
from django.test import TestCase

import arrow
from cms.api import add_plugin
from djangocms_picture.models import Picture

from richie.apps.courses.factories import (
    CategoryFactory,
    CourseFactory,
    CourseRunFactory,
    OrganizationFactory,
)
from richie.apps.search.exceptions import QueryFormatException
from richie.apps.search.indexers.categories import CategoriesIndexer
from richie.apps.search.indexers.courses import CoursesIndexer
from richie.apps.search.indexers.organizations import OrganizationsIndexer
from richie.apps.search.utils.filter_definitions import (
    FilterDefinitionCustom,
    FilterDefinitionLanguages,
    FilterDefinitionTerms,
)

# Emulate the default filters that `CoursesViewSet.list` would instantiate to
# pass to `build_es_query`.
DEFAULT_FILTERS = {
    "availability": FilterDefinitionCustom(
        name="availability",
        human_name="availability",
        choices=[
            (choice, choice, [{"term": {"availability": choice}}])
            for choice in ["coming_soon", "ongoing"]
        ],
    ),
    "categories": FilterDefinitionTerms(name="categories", human_name="categories"),
    "languages": FilterDefinitionLanguages(name="languages", human_name="languages"),
    "organizations": FilterDefinitionTerms(
        name="organizations", human_name="organizations"
    ),
}

SIMPLE_NEW_FILTER = {
    "new": FilterDefinitionCustom(
        name="new",
        human_name="new",
        choices=[("new", "new", [{"term": {"is_new": True}}])],
    )
}


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
                for course_run in course.get_course_runs()
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

    def test_indexers_courses_build_es_query_search_all_courses(self):
        """
        Happy path: build a query that does not filter the courses at all
        """
        # Build a request stub
        request = SimpleNamespace(
            query_params=QueryDict(query_string="limit=2&offset=10")
        )
        self.assertEqual(
            CoursesIndexer.build_es_query(request, DEFAULT_FILTERS),
            (
                2,
                10,
                {"match_all": {}},
                {
                    "all_courses": {
                        "global": {},
                        "aggregations": {
                            "availability@coming_soon": {
                                "filter": {
                                    "bool": {
                                        "must": [
                                            {"term": {"availability": "coming_soon"}}
                                        ]
                                    }
                                }
                            },
                            "availability@ongoing": {
                                "filter": {
                                    "bool": {
                                        "must": [{"term": {"availability": "ongoing"}}]
                                    }
                                }
                            },
                            "categories": {
                                "filter": {"bool": {"must": []}},
                                "aggregations": {
                                    "categories": {"terms": {"field": "categories"}}
                                },
                            },
                            "languages": {
                                "filter": {"bool": {"must": []}},
                                "aggregations": {
                                    "languages": {"terms": {"field": "languages"}}
                                },
                            },
                            "organizations": {
                                "filter": {"bool": {"must": []}},
                                "aggregations": {
                                    "organizations": {
                                        "terms": {"field": "organizations"}
                                    }
                                },
                            },
                        },
                    }
                },
            ),
        )

    def test_indexers_courses_build_es_query_search_by_match_text(self):
        """
        Happy path: build a query that filters courses by matching text
        """
        # Build a request stub
        request = SimpleNamespace(
            query_params=QueryDict(
                query_string="query=some%20phrase%20terms&limit=2&offset=20"
            )
        )
        multi_match = {
            "bool": {
                "should": [
                    {
                        "multi_match": {
                            "fields": ["description.*", "title.*"],
                            "query": "some phrase terms",
                            "type": "cross_fields",
                        }
                    },
                    {
                        "multi_match": {
                            "boost": 0.05,
                            "fields": ["categories_names.*", "organizations_names.*"],
                            "query": "some phrase terms",
                            "type": "cross_fields",
                        }
                    },
                ]
            }
        }

        self.assertEqual(
            CoursesIndexer.build_es_query(request, DEFAULT_FILTERS),
            (
                2,
                20,
                {"bool": {"must": [multi_match]}},
                {
                    "all_courses": {
                        "global": {},
                        "aggregations": {
                            "availability@coming_soon": {
                                "filter": {
                                    "bool": {
                                        "must": [
                                            {"term": {"availability": "coming_soon"}},
                                            multi_match,
                                        ]
                                    }
                                }
                            },
                            "availability@ongoing": {
                                "filter": {
                                    "bool": {
                                        "must": [
                                            {"term": {"availability": "ongoing"}},
                                            multi_match,
                                        ]
                                    }
                                }
                            },
                            "categories": {
                                "filter": {"bool": {"must": [multi_match]}},
                                "aggregations": {
                                    "categories": {"terms": {"field": "categories"}}
                                },
                            },
                            "languages": {
                                "filter": {"bool": {"must": [multi_match]}},
                                "aggregations": {
                                    "languages": {"terms": {"field": "languages"}}
                                },
                            },
                            "organizations": {
                                "filter": {"bool": {"must": [multi_match]}},
                                "aggregations": {
                                    "organizations": {
                                        "terms": {"field": "organizations"}
                                    }
                                },
                            },
                        },
                    }
                },
            ),
        )

    def test_indexers_courses_build_es_query_search_by_terms_organizations(self):
        """
        Happy path: build a query that filters courses by more than 1 related organizations
        """
        # Build a request stub
        request = SimpleNamespace(
            query_params=QueryDict(
                query_string="organizations=13&organizations=15&limit=2"
            )
        )
        terms_organizations = {"terms": {"organizations": [13, 15]}}
        self.assertEqual(
            CoursesIndexer.build_es_query(request, DEFAULT_FILTERS),
            (
                2,
                0,
                {"bool": {"must": [terms_organizations]}},
                {
                    "all_courses": {
                        "global": {},
                        "aggregations": {
                            "availability@coming_soon": {
                                "filter": {
                                    "bool": {
                                        "must": [
                                            {"term": {"availability": "coming_soon"}},
                                            terms_organizations,
                                        ]
                                    }
                                }
                            },
                            "availability@ongoing": {
                                "filter": {
                                    "bool": {
                                        "must": [
                                            {"term": {"availability": "ongoing"}},
                                            terms_organizations,
                                        ]
                                    }
                                }
                            },
                            "categories": {
                                "filter": {"bool": {"must": [terms_organizations]}},
                                "aggregations": {
                                    "categories": {"terms": {"field": "categories"}}
                                },
                            },
                            "languages": {
                                "filter": {
                                    "bool": {
                                        "must": [{"terms": {"organizations": [13, 15]}}]
                                    }
                                },
                                "aggregations": {
                                    "languages": {"terms": {"field": "languages"}}
                                },
                            },
                            "organizations": {
                                "filter": {"bool": {"must": []}},
                                "aggregations": {
                                    "organizations": {
                                        "terms": {"field": "organizations"}
                                    }
                                },
                            },
                        },
                    }
                },
            ),
        )

    def test_indexers_courses_build_es_query_search_by_single_term_organizations(self):
        """
        Happy path: build a query that filters courses by exactly 1 related organization
        """
        # Build a request stub
        request = SimpleNamespace(
            query_params=QueryDict(query_string="organizations=345&limit=2")
        )
        term_organization = {"terms": {"organizations": [345]}}
        self.assertEqual(
            CoursesIndexer.build_es_query(request, DEFAULT_FILTERS),
            (
                2,
                0,
                {"bool": {"must": [term_organization]}},
                {
                    "all_courses": {
                        "global": {},
                        "aggregations": {
                            "availability@coming_soon": {
                                "filter": {
                                    "bool": {
                                        "must": [
                                            {"term": {"availability": "coming_soon"}},
                                            term_organization,
                                        ]
                                    }
                                }
                            },
                            "availability@ongoing": {
                                "filter": {
                                    "bool": {
                                        "must": [
                                            {"term": {"availability": "ongoing"}},
                                            term_organization,
                                        ]
                                    }
                                }
                            },
                            "categories": {
                                "filter": {"bool": {"must": [term_organization]}},
                                "aggregations": {
                                    "categories": {"terms": {"field": "categories"}}
                                },
                            },
                            "languages": {
                                "filter": {
                                    "bool": {
                                        "must": [{"terms": {"organizations": [345]}}]
                                    }
                                },
                                "aggregations": {
                                    "languages": {"terms": {"field": "languages"}}
                                },
                            },
                            "organizations": {
                                "filter": {"bool": {"must": []}},
                                "aggregations": {
                                    "organizations": {
                                        "terms": {"field": "organizations"}
                                    }
                                },
                            },
                        },
                    }
                },
            ),
        )

    def test_indexers_courses_build_es_query_search_by_range_datetimes(self):
        """
        Happy path: build a query that filters courses by start & end date datetime ranges
        """
        # Build a request stub
        start = json.dumps(["2018-01-01T06:00:00Z", None])
        end = json.dumps(["2018-04-30T06:00:00Z", "2018-06-30T06:00:00Z"])
        request = SimpleNamespace(
            query_params=QueryDict(
                query_string="start={start}&end={end}".format(start=start, end=end)
            )
        )
        range_end = {
            "range": {
                "end": {
                    "gte": arrow.get("2018-04-30T06:00:00Z").datetime,
                    "lte": arrow.get("2018-06-30T06:00:00Z").datetime,
                }
            }
        }
        range_start = {
            "range": {
                "start": {
                    "gte": arrow.get("2018-01-01T06:00:00Z").datetime,
                    "lte": None,
                }
            }
        }
        self.assertEqual(
            CoursesIndexer.build_es_query(request, DEFAULT_FILTERS),
            (
                None,
                0,
                {"bool": {"must": [range_end, range_start]}},
                {
                    "all_courses": {
                        "global": {},
                        "aggregations": {
                            "availability@coming_soon": {
                                "filter": {
                                    "bool": {
                                        "must": [
                                            {"term": {"availability": "coming_soon"}},
                                            range_end,
                                            range_start,
                                        ]
                                    }
                                }
                            },
                            "availability@ongoing": {
                                "filter": {
                                    "bool": {
                                        "must": [
                                            {"term": {"availability": "ongoing"}},
                                            range_end,
                                            range_start,
                                        ]
                                    }
                                }
                            },
                            "categories": {
                                "filter": {"bool": {"must": [range_end, range_start]}},
                                "aggregations": {
                                    "categories": {"terms": {"field": "categories"}}
                                },
                            },
                            "languages": {
                                "filter": {"bool": {"must": [range_end, range_start]}},
                                "aggregations": {
                                    "languages": {"terms": {"field": "languages"}}
                                },
                            },
                            "organizations": {
                                "filter": {"bool": {"must": [range_end, range_start]}},
                                "aggregations": {
                                    "organizations": {
                                        "terms": {"field": "organizations"}
                                    }
                                },
                            },
                        },
                    }
                },
            ),
        )

    def test_indexers_courses_build_es_query_search_by_custom_filter(self):
        """
        Happy path: build a query using custom filters
        """
        # Build a request stub
        request = SimpleNamespace(
            query_params=QueryDict(
                query_string="limit=2&offset=10&availability=coming_soon"
            )
        )
        self.assertEqual(
            CoursesIndexer.build_es_query(
                request, {**DEFAULT_FILTERS, **SIMPLE_NEW_FILTER}
            ),
            (
                2,
                10,
                {"bool": {"must": [{"term": {"availability": "coming_soon"}}]}},
                {
                    "all_courses": {
                        "global": {},
                        "aggregations": {
                            "availability@coming_soon": {
                                "filter": {
                                    "bool": {
                                        "must": [
                                            {"term": {"availability": "coming_soon"}}
                                        ]
                                    }
                                }
                            },
                            "availability@ongoing": {
                                "filter": {
                                    "bool": {
                                        "must": [{"term": {"availability": "ongoing"}}]
                                    }
                                }
                            },
                            "new@new": {
                                "filter": {
                                    "bool": {
                                        "must": [
                                            {"term": {"is_new": True}},
                                            {"term": {"availability": "coming_soon"}},
                                        ]
                                    }
                                }
                            },
                            "categories": {
                                "filter": {
                                    "bool": {
                                        "must": [
                                            {"term": {"availability": "coming_soon"}}
                                        ]
                                    }
                                },
                                "aggregations": {
                                    "categories": {"terms": {"field": "categories"}}
                                },
                            },
                            "languages": {
                                "filter": {
                                    "bool": {
                                        "must": [
                                            {"term": {"availability": "coming_soon"}}
                                        ]
                                    }
                                },
                                "aggregations": {
                                    "languages": {"terms": {"field": "languages"}}
                                },
                            },
                            "organizations": {
                                "filter": {
                                    "bool": {
                                        "must": [
                                            {"term": {"availability": "coming_soon"}}
                                        ]
                                    }
                                },
                                "aggregations": {
                                    "organizations": {
                                        "terms": {"field": "organizations"}
                                    }
                                },
                            },
                        },
                    }
                },
            ),
        )

    def test_indexers_courses_build_es_query_combined_search(self):
        """
        Happy path: build a query that filters courses by multiple filters, including a custom
        filter; make all aggs using all of those along with another custom filter
        """
        # Build a request stub
        start = json.dumps(["2018-01-01T06:00:00Z", None])
        end = json.dumps(["2018-04-30T06:00:00Z", "2018-06-30T06:00:00Z"])
        request = SimpleNamespace(
            query_params=QueryDict(
                query_string="categories=42&categories=84&query=these%20phrase%20terms&limit=2&"
                + "languages=fr&availability=ongoing&"
                + "start={start}&end={end}".format(start=start, end=end)
            )
        )

        # Search fragments that are repeated in the query
        availability = {"term": {"availability": "ongoing"}}
        multi_match = {
            "bool": {
                "should": [
                    {
                        "multi_match": {
                            "fields": ["description.*", "title.*"],
                            "query": "these phrase terms",
                            "type": "cross_fields",
                        }
                    },
                    {
                        "multi_match": {
                            "boost": 0.05,
                            "fields": ["categories_names.*", "organizations_names.*"],
                            "query": "these phrase terms",
                            "type": "cross_fields",
                        }
                    },
                ]
            }
        }
        range_end = {
            "range": {
                "end": {
                    "gte": arrow.get("2018-04-30T06:00:00Z").datetime,
                    "lte": arrow.get("2018-06-30T06:00:00Z").datetime,
                }
            }
        }
        range_start = {
            "range": {
                "start": {
                    "gte": arrow.get("2018-01-01T06:00:00Z").datetime,
                    "lte": None,
                }
            }
        }
        terms_categories = {"terms": {"categories": [42, 84]}}
        terms_languages = {"terms": {"languages": ["fr"]}}

        self.assertEqual(
            CoursesIndexer.build_es_query(
                request, {**DEFAULT_FILTERS, **SIMPLE_NEW_FILTER}
            ),
            (
                2,
                0,
                {
                    "bool": {
                        "must": [
                            range_end,
                            terms_languages,
                            multi_match,
                            range_start,
                            terms_categories,
                            availability,
                        ]
                    }
                },
                {
                    "all_courses": {
                        "global": {},
                        "aggregations": {
                            "availability@coming_soon": {
                                "filter": {
                                    "bool": {
                                        "must": [
                                            {"term": {"availability": "coming_soon"}},
                                            range_end,
                                            terms_languages,
                                            multi_match,
                                            range_start,
                                            terms_categories,
                                        ]
                                    }
                                }
                            },
                            "availability@ongoing": {
                                "filter": {
                                    "bool": {
                                        "must": [
                                            availability,
                                            range_end,
                                            terms_languages,
                                            multi_match,
                                            range_start,
                                            terms_categories,
                                        ]
                                    }
                                }
                            },
                            "new@new": {
                                "filter": {
                                    "bool": {
                                        "must": [
                                            {"term": {"is_new": True}},
                                            range_end,
                                            terms_languages,
                                            multi_match,
                                            range_start,
                                            terms_categories,
                                            availability,
                                        ]
                                    }
                                }
                            },
                            "categories": {
                                "filter": {
                                    "bool": {
                                        "must": [
                                            range_end,
                                            terms_languages,
                                            multi_match,
                                            range_start,
                                            availability,
                                        ]
                                    }
                                },
                                "aggregations": {
                                    "categories": {"terms": {"field": "categories"}}
                                },
                            },
                            "languages": {
                                "filter": {
                                    "bool": {
                                        "must": [
                                            range_end,
                                            multi_match,
                                            range_start,
                                            terms_categories,
                                            availability,
                                        ]
                                    }
                                },
                                "aggregations": {
                                    "languages": {"terms": {"field": "languages"}}
                                },
                            },
                            "organizations": {
                                "filter": {
                                    "bool": {
                                        "must": [
                                            range_end,
                                            terms_languages,
                                            multi_match,
                                            range_start,
                                            terms_categories,
                                            availability,
                                        ]
                                    }
                                },
                                "aggregations": {
                                    "organizations": {
                                        "terms": {"field": "organizations"}
                                    }
                                },
                            },
                        },
                    }
                },
            ),
        )

    def test_indexers_courses_build_es_query_search_with_empty_filters(self):
        """
        Edge case: custom filters have been removed entirely through settings
        """
        # Build a request stub
        request = SimpleNamespace(
            query_params=QueryDict(query_string="limit=20&offset=40")
        )

        self.assertEqual(
            CoursesIndexer.build_es_query(request, DEFAULT_FILTERS),
            (
                20,
                40,
                {"match_all": {}},
                {
                    "all_courses": {
                        "global": {},
                        "aggregations": {
                            "availability@coming_soon": {
                                "filter": {
                                    "bool": {
                                        "must": [
                                            {"term": {"availability": "coming_soon"}}
                                        ]
                                    }
                                }
                            },
                            "availability@ongoing": {
                                "filter": {
                                    "bool": {
                                        "must": [{"term": {"availability": "ongoing"}}]
                                    }
                                }
                            },
                            "categories": {
                                "filter": {"bool": {"must": []}},
                                "aggregations": {
                                    "categories": {"terms": {"field": "categories"}}
                                },
                            },
                            "languages": {
                                "filter": {"bool": {"must": []}},
                                "aggregations": {
                                    "languages": {"terms": {"field": "languages"}}
                                },
                            },
                            "organizations": {
                                "filter": {"bool": {"must": []}},
                                "aggregations": {
                                    "organizations": {
                                        "terms": {"field": "organizations"}
                                    }
                                },
                            },
                        },
                    }
                },
            ),
        )

    def test_indexers_courses_build_es_query_search_with_invalid_params(self):
        """
        Error case: the request contained invalid parameters
        """
        with self.assertRaises(QueryFormatException):
            CoursesIndexer.build_es_query(
                SimpleNamespace(query_params=QueryDict(query_string="limit=-2")),
                DEFAULT_FILTERS,
            )

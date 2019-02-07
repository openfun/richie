"""
Tests for the course indexer
"""
# pylint: disable=too-many-lines
import json
import uuid
from types import SimpleNamespace
from unittest import mock
from unittest.mock import patch

from django.conf import settings
from django.forms import ChoiceField, MultipleChoiceField
from django.http.request import QueryDict
from django.test import TestCase

import arrow
from cms.api import add_plugin
from djangocms_picture.models import Picture
from elasticsearch.client import IndicesClient
from elasticsearch.helpers import bulk

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


class CoursesIndexersTestCase(TestCase):
    """
    Test the get_data_for_es() function on the course indexer, as well as our mapping,
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
            CoursesIndexer.get_data_for_es(index="some_index", action="some_action")
        )[0]
        self.assertEqual(
            course_document["organizations"],
            [
                next(
                    OrganizationsIndexer.get_data_for_es(
                        index="some_index", action="some_action"
                    )
                )["_id"]
            ],
        )
        self.assertEqual(
            course_document["categories"],
            [
                next(
                    CategoriesIndexer.get_data_for_es(
                        index="some_index", action="some_action"
                    )
                )["_id"]
            ],
        )

    def test_indexers_courses_get_data_for_es_no_course_run(self):
        """
        A course with no course run should not be indexed.
        """
        course = CourseFactory(should_publish=True)
        self.assertEqual(
            list(
                CoursesIndexer.get_data_for_es(index="some_index", action="some_action")
            ),
            [],
        )

        CourseRunFactory(page_parent=course.extended_object, should_publish=True)
        self.assertNotEqual(
            list(
                CoursesIndexer.get_data_for_es(index="some_index", action="some_action")
            ),
            [],
        )

    @mock.patch.object(
        Picture, "img_src", new_callable=mock.PropertyMock, return_value="123.jpg"
    )
    def test_indexers_courses_get_data_for_es(self, _mock_picture):
        """
        Happy path: the data is retrieved from the models properly formatted
        """
        # Create a course with a page in both english and french
        published_categories = CategoryFactory.create_batch(2, should_publish=True)
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
        course_runs = CourseRunFactory.create_batch(
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
            "cover_image": {"en": "123.jpg", "fr": "123.jpg"},
            "description": {
                "en": "english syllabus line 1. english syllabus line 2.",
                "fr": "syllabus français ligne 1. syllabus français ligne 2.",
            },
            "organizations": [
                str(main_organization.public_extension.extended_object_id),
                str(other_published_organization.public_extension.extended_object_id),
            ],
            "categories": [
                str(s.public_extension.extended_object_id) for s in published_categories
            ],
            "title": {"fr": "un titre cours français", "en": "an english course title"},
        }
        self.assertEqual(
            list(
                CoursesIndexer.get_data_for_es(index="some_index", action="some_action")
            ),
            [
                {
                    **{
                        "_id": str(cr.public_extension.extended_object_id),
                        "_index": "some_index",
                        "_op_type": "some_action",
                        "_type": "course",
                        "start": cr.public_extension.start,
                        "end": cr.public_extension.end,
                        "enrollment_start": cr.public_extension.enrollment_start,
                        "enrollment_end": cr.public_extension.enrollment_end,
                        "is_new": False,
                        "languages": cr.public_extension.languages,
                        "absolute_url": {
                            "en": "/en/an-english-course-title/{:s}/".format(
                                cr.extended_object.get_slug("en")
                            ),
                            "fr": "/fr/un-titre-cours-francais/{:s}/".format(
                                cr.extended_object.get_slug("fr")
                            ),
                        },
                    },
                    **expected_course,
                }
                for cr in course_runs
            ],
        )

    def test_indexers_courses_format_es_object_for_api(self):
        """
        Make sure format_es_object_for_api returns a properly formatted course
        """
        es_course = {
            "_id": 93,
            "_source": {
                "absolute_url": {"en": "campo-qui-format-do"},
                "end": "2018-02-28T06:00:00Z",
                "enrollment_end": "2018-01-31T06:00:00Z",
                "enrollment_start": "2018-01-01T06:00:00Z",
                "languages": ["en", "es"],
                "cover_image": {"en": "image.jpg"},
                "organization_title": {"en": "campo qui format do"},
                "organizations": [42, 84],
                "description": {"en": "Nam aliquet, arcu at sagittis sollicitudin."},
                "start": "2018-02-01T06:00:00Z",
                "categories": [43, 86],
                "title": {"en": "Duis eu arcu erat"},
            },
        }
        self.assertEqual(
            CoursesIndexer.format_es_object_for_api(es_course, "en"),
            {
                "id": 93,
                "start": "2018-02-01T06:00:00Z",
                "end": "2018-02-28T06:00:00Z",
                "enrollment_end": "2018-01-31T06:00:00Z",
                "enrollment_start": "2018-01-01T06:00:00Z",
                "absolute_url": "campo-qui-format-do",
                "cover_image": "image.jpg",
                "languages": ["en", "es"],
                "organizations": [42, 84],
                "state": {
                    "priority": 5,
                    "cta": None,
                    "text": "archived",
                    "datetime": None,
                },
                "categories": [43, 86],
                "title": "Duis eu arcu erat",
            },
        )

    @patch(
        "richie.apps.search.indexers.courses.FILTERS_HARDCODED",
        new={
            "availability": {
                "choices": {
                    choice: [{"term": {"availability": choice}}]
                    for choice in ["coming_soon", "current"]
                },
                "field": ChoiceField,
            }
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
            CoursesIndexer.build_es_query(request),
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
                            "availability@current": {
                                "filter": {
                                    "bool": {
                                        "must": [{"term": {"availability": "current"}}]
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

    @patch(
        "richie.apps.search.indexers.courses.FILTERS_HARDCODED",
        new={
            "availability": {
                "choices": {
                    choice: [{"term": {"availability": choice}}]
                    for choice in ["coming_soon", "current"]
                },
                "field": ChoiceField,
            }
        },
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
            "multi_match": {
                "fields": ["description.*", "title.*"],
                "query": "some phrase terms",
                "type": "cross_fields",
            }
        }

        self.assertEqual(
            CoursesIndexer.build_es_query(request),
            (
                2,
                20,
                {
                    "bool": {
                        "must": [
                            {
                                "multi_match": {
                                    "fields": ["description.*", "title.*"],
                                    "query": "some phrase terms",
                                    "type": "cross_fields",
                                }
                            }
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
                                            multi_match,
                                        ]
                                    }
                                }
                            },
                            "availability@current": {
                                "filter": {
                                    "bool": {
                                        "must": [
                                            {"term": {"availability": "current"}},
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

    @patch(
        "richie.apps.search.indexers.courses.FILTERS_HARDCODED",
        new={
            "availability": {
                "choices": {
                    choice: [{"term": {"availability": choice}}]
                    for choice in ["coming_soon", "current"]
                },
                "field": ChoiceField,
            }
        },
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
            CoursesIndexer.build_es_query(request),
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
                            "availability@current": {
                                "filter": {
                                    "bool": {
                                        "must": [
                                            {"term": {"availability": "current"}},
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

    @patch(
        "richie.apps.search.indexers.courses.FILTERS_HARDCODED",
        new={
            "availability": {
                "choices": {
                    choice: [{"term": {"availability": choice}}]
                    for choice in ["coming_soon", "current"]
                },
                "field": ChoiceField,
            }
        },
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
            CoursesIndexer.build_es_query(request),
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
                            "availability@current": {
                                "filter": {
                                    "bool": {
                                        "must": [
                                            {"term": {"availability": "current"}},
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

    @patch(
        "richie.apps.search.indexers.courses.FILTERS_HARDCODED",
        new={
            "availability": {
                "choices": {
                    choice: [{"term": {"availability": choice}}]
                    for choice in ["coming_soon", "current"]
                },
                "field": ChoiceField,
            }
        },
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
            CoursesIndexer.build_es_query(request),
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
                            "availability@current": {
                                "filter": {
                                    "bool": {
                                        "must": [
                                            {"term": {"availability": "current"}},
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

    @patch(
        "richie.apps.search.indexers.courses.FILTERS_HARDCODED",
        new={
            "availability": {
                "choices": {
                    choice: [{"term": {"availability": choice}}]
                    for choice in ["coming_soon", "current"]
                },
                "field": ChoiceField,
            },
            "new": {
                "choices": {"new": [{"term": {"session_number": 1}}]},
                "field": MultipleChoiceField,
            },
        },
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
            CoursesIndexer.build_es_query(request),
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
                            "availability@current": {
                                "filter": {
                                    "bool": {
                                        "must": [{"term": {"availability": "current"}}]
                                    }
                                }
                            },
                            "new@new": {
                                "filter": {
                                    "bool": {
                                        "must": [
                                            {"term": {"session_number": 1}},
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

    @patch(
        "richie.apps.search.indexers.courses.FILTERS_HARDCODED",
        new={
            "availability": {
                "choices": {
                    choice: [{"term": {"availability": choice}}]
                    for choice in ["coming_soon", "current"]
                },
                "field": ChoiceField,
            },
            "new": {
                "choices": {"new": [{"term": {"is_new": True}}]},
                "field": MultipleChoiceField,
            },
        },
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
                + "languages=fr&availability=current&"
                + "start={start}&end={end}".format(start=start, end=end)
            )
        )

        # Search fragments that are repeated in the query
        availability = {"term": {"availability": "current"}}
        multi_match = {
            "multi_match": {
                "fields": ["description.*", "title.*"],
                "query": "these phrase terms",
                "type": "cross_fields",
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
            CoursesIndexer.build_es_query(request),
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
                            "availability@current": {
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

    @patch(
        "richie.apps.search.indexers.courses.FILTERS_HARDCODED",
        new={
            "availability": {
                "choices": {
                    choice: [{"term": {"availability": choice}}]
                    for choice in ["coming_soon", "current"]
                },
                "field": ChoiceField,
            }
        },
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
            CoursesIndexer.build_es_query(request),
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
                            "availability@current": {
                                "filter": {
                                    "bool": {
                                        "must": [{"term": {"availability": "current"}}]
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
                SimpleNamespace(query_params=QueryDict(query_string="limit=-2"))
            )

    def test_indexers_courses_list_sorting_script(self):
        """
        Make sure our courses list sorting script (Lucene expression) is working as intended
        """
        # Set up the index we'll use to run our test
        indices_client = IndicesClient(client=settings.ES_CLIENT)
        # Delete any existing indexes so we get a clean slate
        indices_client.delete(index="_all")
        # Create an index we'll use to test the ES features
        indices_client.create(index="test_courses_list_sorting_index")
        # Use the default courses mapping from the Indexer for briefness' sake
        indices_client.put_mapping(
            body=CoursesIndexer.mapping,
            doc_type="courses",
            index="test_courses_list_sorting_index",
        )

        settings.ES_CLIENT.put_script(
            id="sort_list", body=CoursesIndexer.scripts["sort_list"]
        )

        # Add our sample of courses to the test index we just created
        # NB: we need to add 8 courses because we're splitting them into 4 buckets and
        # then using a specific ordering within each of these
        bulk(
            # NB: courses order & IDs have been voluntarily shuffled to ensure we don't
            # accidentally end up with the correct ordering if our sorting does not occur at all.
            actions=[
                {
                    # N. 3: not started yet, first upcoming course to start
                    "_id": uuid.uuid4(),
                    "_index": "test_courses_list_sorting_index",
                    "_op_type": "create",
                    "_type": "courses",
                    "control_id": "4",
                    "end": arrow.utcnow().shift(days=+150).isoformat(),
                    "enrollment_end": arrow.utcnow().shift(days=+30).isoformat(),
                    "start": arrow.utcnow().shift(days=+15).isoformat(),
                },
                {
                    # N. 1: ongoing course, next open course to end enrollment
                    "_id": uuid.uuid4(),
                    "_index": "test_courses_list_sorting_index",
                    "_op_type": "create",
                    "_type": "courses",
                    "control_id": "3",
                    "end": arrow.utcnow().shift(days=+120).isoformat(),
                    "enrollment_end": arrow.utcnow().shift(days=+5).isoformat(),
                    "start": arrow.utcnow().shift(days=-5).isoformat(),
                },
                {
                    # N. 7: the other already finished course; it finished more recently than N. 8
                    "_id": uuid.uuid4(),
                    "_index": "test_courses_list_sorting_index",
                    "_op_type": "create",
                    "_type": "courses",
                    "control_id": "1",
                    "end": arrow.utcnow().shift(days=-15).isoformat(),
                    "enrollment_end": arrow.utcnow().shift(days=-60).isoformat(),
                    "start": arrow.utcnow().shift(days=-80).isoformat(),
                },
                {
                    # N. 6: ongoing course, enrollment has been over for the longest
                    "_id": uuid.uuid4(),
                    "_index": "test_courses_list_sorting_index",
                    "_op_type": "create",
                    "_type": "courses",
                    "control_id": "7",
                    "end": arrow.utcnow().shift(days=+30).isoformat(),
                    "enrollment_end": arrow.utcnow().shift(days=-45).isoformat(),
                    "start": arrow.utcnow().shift(days=-75).isoformat(),
                },
                {
                    # N. 8: the course that has been over for the longest
                    "_id": uuid.uuid4(),
                    "_index": "test_courses_list_sorting_index",
                    "_op_type": "create",
                    "_type": "courses",
                    "control_id": "5",
                    "end": arrow.utcnow().shift(days=-30).isoformat(),
                    "enrollment_end": arrow.utcnow().shift(days=-90).isoformat(),
                    "start": arrow.utcnow().shift(days=-120).isoformat(),
                },
                {
                    # N. 4: not started yet, will start after the other upcoming course
                    "_id": uuid.uuid4(),
                    "_index": "test_courses_list_sorting_index",
                    "_op_type": "create",
                    "_type": "courses",
                    "control_id": "8",
                    "end": arrow.utcnow().shift(days=+120).isoformat(),
                    "enrollment_end": arrow.utcnow().shift(days=+60).isoformat(),
                    "start": arrow.utcnow().shift(days=+45).isoformat(),
                },
                {
                    # N. 2: ongoing course, can still be enrolled in for longer than N. 1
                    "_id": uuid.uuid4(),
                    "_index": "test_courses_list_sorting_index",
                    "_op_type": "create",
                    "_type": "courses",
                    "control_id": "6",
                    "end": arrow.utcnow().shift(days=+105).isoformat(),
                    "enrollment_end": arrow.utcnow().shift(days=+15).isoformat(),
                    "start": arrow.utcnow().shift(days=-15).isoformat(),
                },
                {
                    # N. 5: ongoing course, most recent to end enrollment
                    "_id": uuid.uuid4(),
                    "_index": "test_courses_list_sorting_index",
                    "_op_type": "create",
                    "_type": "courses",
                    "control_id": "2",
                    "end": arrow.utcnow().shift(days=+15).isoformat(),
                    "enrollment_end": arrow.utcnow().shift(days=-30).isoformat(),
                    "start": arrow.utcnow().shift(days=-90).isoformat(),
                },
            ],
            chunk_size=settings.ES_CHUNK_SIZE,
            client=settings.ES_CLIENT,
        )

        indices_client.refresh()

        # Comparing lists of ids is enough to ensure proper ordering, as list comprehensions
        # explicitly preserve order
        self.assertEqual(
            [
                es_course["_source"]["control_id"]
                for es_course in settings.ES_CLIENT.search(
                    index="test_courses_list_sorting_index",
                    doc_type="courses",
                    body={
                        "query": {"match_all": {}},
                        "sort": CoursesIndexer.get_list_sorting_script(),
                    },
                    from_=0,
                    size=10,
                )["hits"]["hits"]
            ],
            ["3", "6", "4", "8", "2", "7", "1", "5"],
        )

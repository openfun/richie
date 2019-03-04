"""
ElasticSearch course document management utilities
"""
from collections import defaultdict
from datetime import MAXYEAR
from functools import reduce

from django.conf import settings
from django.db.models import Prefetch

import arrow
import dateutil.parser
from cms.models import Title
from djangocms_picture.models import Picture

from richie.plugins.simple_text_ckeditor.models import SimpleText

from ...courses.models import Course, CourseRun
from ..defaults import COURSES_COVER_IMAGE_HEIGHT, COURSES_COVER_IMAGE_WIDTH
from ..exceptions import QueryFormatException
from ..forms import CourseListForm
from ..partial_mappings import MULTILINGUAL_TEXT
from ..utils.i18n import get_best_field_language
from ..utils.indexers import slice_string_for_completion


class CoursesIndexer:
    """
    Makes available the parameters the indexer requires as well as functions to shape
    objects getting into and out of ElasticSearch
    """

    document_type = "course"
    index_name = "richie_courses"
    mapping = {
        "dynamic_templates": MULTILINGUAL_TEXT,
        "properties": {
            # Dates
            "start": {"type": "date"},
            "end": {"type": "date"},
            "enrollment_start": {"type": "date"},
            "enrollment_end": {"type": "date"},
            # Keywords
            "categories": {"type": "keyword"},
            "languages": {"type": "keyword"},
            "organizations": {"type": "keyword"},
            # Searchable
            **{
                "complete.{:s}".format(lang): {"type": "completion"}
                for lang, _ in settings.LANGUAGES
            },
            "description": {"type": "object"},
            "is_new": {"type": "boolean"},
            "title": {"type": "object"},
            # Not searchable
            "absolute_url": {"type": "object", "enabled": False},
            "cover_image": {"type": "object", "enabled": False},
        },
    }
    display_fields = [
        "start",
        "end",
        "enrollment_start",
        "enrollment_end",
        "absolute_url",
        "cover_image",
        "languages",
        "organizations",
        "categories",
        "title.*",
    ]

    # Define the scoring boost (in ElasticSearch) related value names receive when using
    # full-text search.
    # For example, when a user searches for "Science" in full-text, it should match any
    # course whose category contains "Science" or a related word, albeit with a lower
    # score than courses that include it in their title or description.
    # This lower score factor is the boost value we get or set here.
    fulltext_search_filter_matching_boost = 0.05

    scripts = {
        # The ordering process first splits the courses into four groups, with further ordering
        # inside each one of those groups.
        #
        # Here's a schematic representation that shows the ordering factor for each
        # course (to be used in ascending order later on) :
        #
        #          TOP OF THE LIST
        #          ———————————————
        # ----- NOW (current timestamp) -----
        #         Courses in bucket 1
        #
        #  < ~1 x datetime.MAXYEAR distance >
        #
        # ------ ~1 x datetime.MAXYEAR ------
        #         Courses in bucket 2
        #
        #  < ~1 x datetime.MAXYEAR distance >
        #
        #         Courses in bucket 3
        # ------ ~2 x datetime.MAXYEAR ------
        #
        #  < ~1 x datetime.MAXYEAR distance >
        #
        #         Courses in bucket 4
        # ------ ~3 x datetime.MAXYEAR ------
        #          ———————————————
        #          END OF THE LIST
        #
        # For reference MAXYEAR's timestamp is more than 2 orders of magnitude larger than
        # this year's timestamp (2018).
        # This means there can be no overlap between the various buckets, but we can still
        # sort courses inside each bucket as we see fit by simply adding timestamps (ascending
        # order) or substracting them (descending order).
        "sort_list": {
            "script": {
                "lang": "expression",
                "source": (
                    # 4- Courses that have ended.
                    # Ordered by descending end datetime. The course that has finished last
                    # is displayed first.
                    "doc['end'].value < ms_since_epoch ? "
                    "3 * max_date - doc['end'].value : "
                    # 3- Courses that have not ended but can no longer be enrolled in.
                    # Ordered by descending end of enrollment datetime. The course for which
                    # enrollment has ended last is displayed first.
                    "doc['enrollment_end'].value < ms_since_epoch ? "
                    "2 * max_date - doc['enrollment_end'].value : "
                    # 2- Courses that have not started yet.
                    # Ordered by starting datetime. The next course to start is displayed first.
                    "ms_since_epoch < doc['start'].value ? "
                    "max_date + doc['start'].value : "
                    # 1- Courses that are currently open and can be enrolled in.
                    # Ordered by ascending end of enrollment datetime. The next course to end
                    # enrollment is displayed first.
                    "doc['enrollment_end'].value"
                ),
            }
        }
    }

    @classmethod
    def get_data_for_es(cls, index, action):
        """
        Load all the course runs from the Course model and format them for the ElasticSearch index
        """
        for course in (
            Course.objects.filter(
                extended_object__publisher_is_draft=False,
                extended_object__title_set__published=True,
            )
            .prefetch_related(
                Prefetch(
                    "extended_object__title_set",
                    to_attr="published_titles",
                    queryset=Title.objects.filter(published=True),
                )
            )
            .distinct()
        ):
            # Prepare published titles
            titles = {
                t.language: t.title for t in course.extended_object.published_titles
            }

            # Prepare cover images
            cover_images = {}
            for cover_image in Picture.objects.filter(
                cmsplugin_ptr__placeholder__page=course.extended_object,
                cmsplugin_ptr__placeholder__slot="course_cover",
            ):
                # Force the image format before computing it
                cover_image.use_no_cropping = False
                cover_image.width = COURSES_COVER_IMAGE_WIDTH
                cover_image.height = COURSES_COVER_IMAGE_HEIGHT
                cover_images[cover_image.cmsplugin_ptr.language] = cover_image.img_src

            # Prepare syllabus texts
            syllabus_texts = defaultdict(list)
            for simple_text in SimpleText.objects.filter(
                cmsplugin_ptr__placeholder__page=course.extended_object,
                cmsplugin_ptr__placeholder__slot="course_syllabus",
            ):
                syllabus_texts[simple_text.cmsplugin_ptr.language].append(
                    simple_text.body
                )

            # Make sure we get title information for categories in the same request
            category_pages = (
                course.get_root_to_leaf_category_pages()
                .prefetch_related(
                    Prefetch(
                        "title_set",
                        to_attr="published_titles",
                        queryset=Title.objects.filter(published=True),
                    )
                )
                .only("pk")
            )

            # Make sure we get title information for organizations in the same request
            organizations = (
                course.get_organizations()
                .prefetch_related(
                    Prefetch(
                        "extended_object__title_set",
                        to_attr="published_titles",
                        queryset=Title.objects.filter(published=True),
                    )
                )
                .only("extended_object")
                .distinct()
            )

            course_runs = course.get_course_runs()
            for course_run in course_runs:
                yield {
                    "_id": str(course_run.extended_object_id),
                    "_index": index,
                    "_op_type": action,
                    "_type": cls.document_type,
                    "start": course_run.start,
                    "end": course_run.end,
                    "enrollment_start": course_run.enrollment_start,
                    "enrollment_end": course_run.enrollment_end,
                    "absolute_url": {
                        language: course_run.extended_object.get_absolute_url(language)
                        for language in titles.keys()
                    },
                    "categories": [str(page.pk) for page in category_pages],
                    # Index the names of categories to surface them in full text searches
                    "categories_names": reduce(
                        lambda acc, title: {
                            **acc,
                            title.language: acc[title.language] + [title.title]
                            if acc.get(title.language)
                            else [title.title],
                        },
                        [
                            title
                            for page in category_pages
                            for title in page.published_titles
                        ],
                        {},
                    ),
                    "complete": {
                        language: slice_string_for_completion(title)
                        for language, title in titles.items()
                    },
                    "cover_image": cover_images,
                    "description": {
                        l: " ".join(st) for l, st in syllabus_texts.items()
                    },
                    "is_new": len(course_runs) == 1,
                    "languages": course_run.languages,
                    "organizations": [
                        str(id)
                        for id in course.get_organizations().values_list(
                            "public_extension__extended_object", flat=True
                        )
                        if id is not None
                    ],
                    # Index the names of organizations to surface them in full text searches
                    "organizations_names": reduce(
                        lambda acc, title: {
                            **acc,
                            title.language: acc[title.language] + [title.title]
                            if acc.get(title.language)
                            else [title.title],
                        },
                        [
                            title
                            for organization in organizations
                            for title in organization.extended_object.published_titles
                        ],
                        {},
                    ),
                    "title": titles,
                }

    @staticmethod
    def format_es_object_for_api(es_course, best_language):
        """
        Format a course stored in ES into a consistent and easy-to-consume record for
        API consumers
        """
        source = es_course["_source"]
        return {
            "id": es_course["_id"],
            "start": source["start"],
            "end": source["end"],
            "enrollment_start": source["enrollment_start"],
            "enrollment_end": source["enrollment_end"],
            "absolute_url": get_best_field_language(
                source["absolute_url"], best_language
            ),
            "categories": source["categories"],
            "cover_image": get_best_field_language(
                source["cover_image"], best_language
            ),
            "languages": source["languages"],
            "organizations": source["organizations"],
            "state": CourseRun.compute_state(
                dateutil.parser.parse(source["start"]),
                dateutil.parser.parse(source["end"]),
                dateutil.parser.parse(source["enrollment_start"]),
                dateutil.parser.parse(source["enrollment_end"]),
            )._asdict(),
            "title": get_best_field_language(source["title"], best_language),
        }

    @classmethod
    # pylint: disable=R0912, R0914
    def build_es_query(cls, request, filters):
        """
        Build an ElasticSearch query and its related aggregations, to be consumed by the ES client
        in the Courses ViewSet
        """
        # QueryDict/MultiValueDict breaks lists: we need to normalize them
        # Unpacking does not trigger the broken accessor so we get the proper value
        params_form_values = {
            k: v[0] if len(v) == 1 else v for k, v in request.query_params.lists()
        }
        # Use QueryDict/MultiValueDict as a shortcut to make sure we get arrays for our filters,
        # which should be arrays even if their length is one
        for filter_name in filters:
            params_form_values[filter_name] = request.query_params.getlist(filter_name)
        # Instantiate the form to allow validation/cleaning
        params_form = CourseListForm(params_form_values)

        # Raise an exception with error information if the query params are not valid
        if not params_form.is_valid():
            raise QueryFormatException(params_form.errors)

        # Note: test_elasticsearch_feature.py needs to be updated whenever the search call
        # is updated and makes use new features.
        # queries is an array of individual queries that will be combined through "bool" before
        # we pass them to ES. See the docs en bool queries.
        # https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-bool-query.html
        queries = []
        for param, value in params_form.cleaned_data.items():
            # Skip falsy values as we're not using them in our query
            if not value:
                continue

            # The datetimerange fields are all translated to the ES query DSL the same way
            if param in ["end", "enrollment_end", "enrollment_start", "start"]:
                # Add the relevant range criteria to the queries
                start, end = value
                queries = [
                    *queries,
                    {
                        "key": param,
                        "fragment": [
                            {
                                "range": {
                                    param: {
                                        "gte": start.datetime if start else None,
                                        "lte": end.datetime if end else None,
                                    }
                                }
                            }
                        ],
                    },
                ]

            elif param in filters:
                # Add the query fragments to the query
                queries = queries + filters[param].get_query_fragment(value)

            # Search is a regular (multilingual) match query
            elif param == "query":
                queries = [
                    *queries,
                    {
                        "key": param,
                        "fragment": [
                            {
                                "bool": {
                                    "should": [
                                        {
                                            "multi_match": {
                                                "fields": ["description.*", "title.*"],
                                                "query": value,
                                                "type": "cross_fields",
                                            }
                                        },
                                        {
                                            "multi_match": {
                                                "boost": cls.fulltext_search_filter_matching_boost,
                                                "fields": [
                                                    "categories_names.*",
                                                    "organizations_names.*",
                                                ],
                                                "query": value,
                                                "type": "cross_fields",
                                            }
                                        },
                                    ]
                                }
                            }
                        ],
                    },
                ]

        # Default to a match_all query
        if not queries:
            query = {"match_all": {}}
        else:
            # Concatenate all the sub-queries lists together to form the queries list
            query = {
                "bool": {
                    "must":
                    # queries => map(pluck("fragment")) => flatten()
                    [clause for kf_pair in queries for clause in kf_pair["fragment"]]
                }
            }

        # Concatenate our hardcoded filters query fragments with organizations and categories terms
        # aggregations build on-the-fly
        aggs = {
            "all_courses": {
                "global": {},
                "aggregations": reduce(
                    # Merge all the partial aggregations dicts together
                    lambda acc, aggs_fragment: {**acc, **aggs_fragment},
                    # Generate a partial aggregations dict (an aggs_fragment) for each filter
                    [filter.get_aggs_fragment(queries) for filter in filters.values()],
                    {},
                ),
            }
        }

        return (
            params_form.cleaned_data.get("limit"),
            params_form.cleaned_data.get("offset") or 0,
            query,
            aggs,
        )

    @staticmethod
    def get_list_sorting_script():
        """
        Call the relevant sorting script for courses lists, regenerating the parameters on each
        call. This will allow the ms_since_epoch value to stay relevant even if the ES instance
        and/or the Django server are long running.

        Note: we use script storage to save time on the script compilation, which is an expensive
        operation. We'll only do it once at bootstrap time.
        """
        return {
            "_script": {
                "order": "asc",
                "script": {
                    "id": "sort_list",
                    "params": {
                        "max_date": arrow.get(MAXYEAR, 12, 31).timestamp * 1000,
                        "ms_since_epoch": arrow.utcnow().timestamp * 1000,
                    },
                },
                "type": "number",
            }
        }

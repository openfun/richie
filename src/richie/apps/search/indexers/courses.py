"""
ElasticSearch course document management utilities
"""
from collections import defaultdict
from datetime import MAXYEAR
from functools import reduce

from django.conf import settings
from django.db.models import Prefetch

import arrow
from cms.models import Title
from djangocms_picture.models import Picture

from richie.plugins.simple_text_ckeditor.models import SimpleText

from ...courses.models import Course
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
            "course_runs": {
                "type": "nested",
                "properties": {
                    "id": {"type": "keyword"},
                    "start": {"type": "date"},
                    "end": {"type": "date"},
                    "enrollment_start": {"type": "date"},
                    "enrollment_end": {"type": "date"},
                    "languages": {"type": "keyword"},
                },
            },
            # Keywords
            "categories": {"type": "keyword"},
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
        "absolute_url",
        "categories",
        "cover_image",
        "organizations",
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
        # The ordering process first splits the courses into 7 buckets (Bucket 0 to Bucket 6),
        # with further ordering inside each one of those buckets.
        #
        # Here's a schematic representation that shows the ordering factor for each
        # course (to be used in ascending order later on) :
        #
        #                   TOP OF THE LIST
        #                   ———————————————
        # -------------- NOW (current timestamp) --------------
        #     Bucket 0: Courses that are ongoing and open
        #      sorted by ascending end of enrollment date
        #         < 1 x datetime.MAXYEAR distance >
        #
        # --------------   1 x datetime.MAXYEAR  --------------
        #      Bucket 1: Courses that are future and open
        #          sorted by ascending start date
        #         < 2 x datetime.MAXYEAR distance >
        #
        # --------------   2 x datetime.MAXYEAR  --------------
        #  Bucket 2: Courses that are future but not yet open
        #          sorted by ascending start date
        #         < 3 x datetime.MAXYEAR distance >
        #
        # --------------   3 x datetime.MAXYEAR  --------------
        # Bucket 3: Courses that are future but already closed
        #      sorted by descending end of enrollment date
        #         < 4 x datetime.MAXYEAR distance >
        #
        # --------------   4 x datetime.MAXYEAR  --------------
        #     Bucket 4: Courses that are ongoing by closed
        #      sorted by descending end of enrollment date
        #         < 5 x datetime.MAXYEAR distance >
        #
        # --------------   5 x datetime.MAXYEAR  --------------
        #     Bucket 5: Courses that are ongoing and open
        #           sorted by descending end date
        #         < 6 x datetime.MAXYEAR distance >
        #
        # --------------   6 x datetime.MAXYEAR  --------------
        #     Bucket 6: Courses that have no course runs
        #                No specific ordering
        #                   ———————————————
        #                   END OF THE LIST
        #
        # For reference MAXYEAR's timestamp is more than 2 orders of magnitude larger than
        # this year's timestamp (2018).
        # This means there can be no overlap between the various buckets, but we can still
        # sort courses inside each bucket as we see fit by simply adding timestamps (ascending
        # order) or substracting them (descending order).
        "sort_list": {
            "script": {
                "lang": "painless",
                "source": """
                    DateTimeFormatter formatter = DateTimeFormatter.ofPattern(
                        "yyyy-MM-dd'T'HH:mm:ss[.SSSSSS]XXXXX"
                    );
                    int best_state = 6;
                    int best_index = 0;
                    long start, end, enrollment_start, enrollment_end;

                    for (int i = 0; i < params._source.course_runs.length; ++i) {
                        start = ZonedDateTime.parse(
                            params._source.course_runs[i]['start'], formatter
                        ).toInstant().toEpochMilli();
                        end = ZonedDateTime.parse(
                            params._source.course_runs[i]['end'], formatter
                        ).toInstant().toEpochMilli();
                        enrollment_start = ZonedDateTime.parse(
                            params._source.course_runs[i]['enrollment_start'], formatter
                        ).toInstant().toEpochMilli();
                        enrollment_end = ZonedDateTime.parse(
                            params._source.course_runs[i]['enrollment_end'], formatter
                        ).toInstant().toEpochMilli();

                        if (start <  params.ms_since_epoch) {
                            if (end >  params.ms_since_epoch && params.states.contains(0)) {
                                if (enrollment_end >  params.ms_since_epoch) {
                                    // ongoing open
                                    best_state = 0;
                                    best_index = i;
                                    // We already found the best... let's break to save iterations
                                    break;
                                }
                                else {
                                    // ongoing closed
                                    if (best_state > 4 && params.states.contains(4)) {
                                        best_state = 4;
                                        best_index = i;
                                    }
                                }
                            }
                            else {
                                // archived
                                if (best_state > 5 && params.states.contains(5)) {
                                    best_state = 5;
                                    best_index = i;
                                    // Course runs are ordered by `end` date so we know all
                                    // remaining course runs will also be archived.
                                    // Let's break to save iterations:
                                    break;
                                }
                            }
                        }
                        else if (enrollment_start >  params.ms_since_epoch) {
                            // future not yet open
                            if (best_state > 2 && params.states.contains(2)) {
                                best_state = 2;
                                best_index = i;
                            }
                        }
                        else if (enrollment_end > params.ms_since_epoch) {
                            // future open
                            if (best_state > 1 && params.states.contains(1)) {
                                best_state = 1;
                                best_index = i;
                            }
                        }
                        else {
                            // future already closed
                            if (best_state > 3 && params.states.contains(3)) {
                                best_state = 3;
                                best_index = i;
                            }
                        }
                    }

                    if (best_state == 0) {
                        // The course is ongoing and open
                        // Ordered by ascending end of enrollment datetime. The next course to
                        // end enrollment is displayed first.
                        return ZonedDateTime.parse(
                            params._source.course_runs[best_index]['enrollment_end'], formatter
                        ).toInstant().toEpochMilli();
                    }
                    else if (best_state == 1) {
                        // The course is future and open
                        // Ordered by starting datetime. The next course to start is displayed
                        // first.
                        return params.max_date + ZonedDateTime.parse(
                            params._source.course_runs[best_index]['start'], formatter
                        ).toInstant().toEpochMilli();
                    }
                    else if (best_state == 2) {
                        // The course is future but not yet open for enrollment
                        // Ordered by starting datetime. The next course to start is displayed
                        // first.
                        return 2 * params.max_date + ZonedDateTime.parse(
                            params._source.course_runs[best_index]['start'], formatter
                        ).toInstant().toEpochMilli();
                    }
                    else if (best_state == 3) {
                        // The course is future but already closed for enrollment
                        // Ordered by starting datetime. The next course to start is displayed
                        // first.
                        return 3 * params.max_date - ZonedDateTime.parse(
                            params._source.course_runs[best_index]['enrollment_end'], formatter
                        ).toInstant().toEpochMilli();
                    }
                    else if (best_state == 4) {
                        // The course is ongoing and closed for enrollment
                        // Ordered by descending end of enrollment datetime. The course for which
                        // enrollment has ended last is displayed first.
                        return 4 * params.max_date - ZonedDateTime.parse(
                            params._source.course_runs[best_index]['enrollment_end'], formatter
                        ).toInstant().toEpochMilli();
                    }
                    else if (best_state == 5) {
                        // The course is archived
                        // Ordered by descending end datetime. The course that has finished last
                        // is displayed first.
                        return 5 * params.max_date - ZonedDateTime.parse(
                            params._source.course_runs[best_index]['end'], formatter
                        ).toInstant().toEpochMilli();
                    }
                    // The course has no course runs
                    return 6 * params.max_date;
                """,
            }
        }
    }

    @classmethod
    def get_es_document_for_course(cls, course, index, action):
        """
        Build an Elasticsearch document from the course instance.
        """
        # Prepare published titles
        titles = {
            t.language: t.title
            for t in Title.objects.filter(page=course.extended_object, published=True)
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
            syllabus_texts[simple_text.cmsplugin_ptr.language].append(simple_text.body)

        # Prepare categories, making sure we get title information for categories
        # in the same request
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
            .distinct()
        )

        # Prepare organizations, making sure we get title information for organizations
        # in the same request
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

        # Prepare course runs
        # Ordering them by their `end` date is important to optimize sorting and other
        # computations that require looping on the course runs
        course_runs = list(
            course.get_course_runs()
            .order_by("-end")
            .values("start", "end", "enrollment_start", "enrollment_end", "languages")
        )

        return {
            "_id": str(course.extended_object_id),
            "_index": index,
            "_op_type": action,
            "_type": cls.document_type,
            "absolute_url": {
                language: course.extended_object.get_absolute_url(language)
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
                [title for page in category_pages for title in page.published_titles],
                {},
            ),
            "complete": {
                language: slice_string_for_completion(title)
                for language, title in titles.items()
            },
            "course_runs": course_runs,
            "cover_image": cover_images,
            "description": {l: " ".join(st) for l, st in syllabus_texts.items()},
            "is_new": len(course_runs) == 1,
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

    @classmethod
    def get_es_documents(cls, index, action):
        """
        Loop on all the courses in database and format them for the ElasticSearch index
        """
        for course in Course.objects.filter(
            extended_object__publisher_is_draft=False,
            extended_object__title_set__published=True,
        ).distinct():
            yield cls.get_es_document_for_course(course, index, action)

    @staticmethod
    def format_es_object_for_api(es_course, best_language):
        """
        Format a course stored in ES into a consistent and easy-to-consume record for
        API consumers
        """
        source = es_course["_source"]
        return {
            "id": es_course["_id"],
            "absolute_url": get_best_field_language(
                source["absolute_url"], best_language
            ),
            "categories": source["categories"],
            "cover_image": get_best_field_language(
                source["cover_image"], best_language
            ),
            "organizations": source["organizations"],
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
    def get_list_sorting_script(states=None):
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
                        "states": states or [],
                        "max_date": arrow.get(MAXYEAR, 12, 31).timestamp * 1000,
                        "ms_since_epoch": arrow.utcnow().timestamp * 1000,
                    },
                },
                "type": "number",
            }
        }

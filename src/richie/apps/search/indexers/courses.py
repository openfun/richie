"""
ElasticSearch course document management utilities
"""
from collections import defaultdict
from datetime import datetime
from functools import reduce

from django.conf import settings
from django.db.models import Prefetch
from django.utils import translation

from cms.models import Title
from djangocms_picture.models import Picture

from richie.plugins.simple_text_ckeditor.models import SimpleText

from ...courses.models import MAX_DATE, Course, CourseState
from ..defaults import COURSES_COVER_IMAGE_HEIGHT, COURSES_COVER_IMAGE_WIDTH
from ..forms import CourseSearchForm
from ..text_indexing import MULTILINGUAL_TEXT
from ..utils.i18n import get_best_field_language
from ..utils.indexers import slice_string_for_completion
from . import ES_INDICES


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
        "organizations_names",
        "title.*",
    ]
    form = CourseSearchForm

    scripts = {
        # We use the same `state` script for several use cases as the code is mostly common and
        # we don't have any other way to factorize it.
        #
        # 1) Field script
        # ===============
        # Computing a course's state based on the current state of each of its course runs.
        #
        # 2) Sorting script
        # =================
        # The ordering process first splits the courses into 7 buckets (Bucket 0 to Bucket 6),
        # based on their state with further ordering inside each one of those buckets.
        #
        # Here's a schematic representation that shows the ordering factor for each
        # course (to be used in ascending order later on) :
        #
        #                   TOP OF THE LIST
        #                   ———————————————
        # -------------- NOW (current timestamp) --------------
        #     Bucket 0: Courses that are ongoing and open
        #      sorted by ascending end of enrollment date
        #
        # --------------   1 x datetime.MAXYEAR  --------------
        #      Bucket 1: Courses that are future and open
        #            sorted by ascending start date
        #
        # --------------   2 x datetime.MAXYEAR  --------------
        #  Bucket 2: Courses that are future but not yet open
        #            sorted by ascending start date
        #
        # --------------   3 x datetime.MAXYEAR  --------------
        # Bucket 3: Courses that are future but already closed
        #      sorted by descending end of enrollment date
        #
        # --------------   4 x datetime.MAXYEAR  --------------
        #     Bucket 4: Courses that are ongoing but closed
        #      sorted by descending end of enrollment date
        #
        # --------------   5 x datetime.MAXYEAR  --------------
        #          Bucket 5: Courses that are archived
        #             sorted by descending end date
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
        "state": {
            "script": {
                "lang": "painless",
                "source": """
                    DateTimeFormatter formatter = DateTimeFormatter.ofPattern(
                        "yyyy-MM-dd'T'HH:mm:ss[.SSSSSS]XXXXX"
                    );
                    int best_state = 6;
                    int best_index = 0;
                    long start, end, enrollment_start, enrollment_end;
                    Set intersection;

                    // Go through the sorted course runs nested under this course to look for the
                    // best course run (open for enrollment > future > on-going > archived)
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

                        // Use language sets to check their intersection
                        intersection = new HashSet(params._source.course_runs[i]['languages']);
                        if (params.languages != null) {
                            intersection.retainAll(new HashSet(params.languages))
                        }

                        // Only consider this course run if it is in a desired language
                        if (params.languages == null || !intersection.isEmpty()) {
                            if (start < params.ms_since_epoch) {
                                if (end > params.ms_since_epoch) {
                                    if (enrollment_end > params.ms_since_epoch) {
                                        // ongoing open
                                        if (params.states == null || params.states.contains(0)) {
                                            best_state = 0;
                                            best_index = i;
                                            // We already found the best... let's save iterations
                                            break;
                                        }
                                    }
                                    else {
                                        // ongoing closed
                                        if (
                                            best_state > 4 && (
                                                params.states == null ||
                                                params.states.contains(4)
                                            )
                                        ) {
                                            best_state = 4;
                                            best_index = i;
                                        }
                                    }
                                }
                                else {
                                    // archived
                                    if (
                                        best_state > 5 && (
                                            params.states == null ||
                                            params.states.contains(5)
                                        )
                                    ) {
                                        best_state = 5;
                                        best_index = i;
                                        // Course runs are ordered by `end` date so we know all
                                        // remaining course runs will also be archived.
                                        // Let's break to save iterations:
                                        break;
                                    }
                                }
                            }
                            else if (enrollment_start > params.ms_since_epoch) {
                                // future not yet open
                                if (
                                    best_state > 2 && (
                                        params.states == null ||
                                        params.states.contains(2)
                                    )
                                ) {
                                    best_state = 2;
                                    best_index = i;
                                }
                            }
                            else if (enrollment_end > params.ms_since_epoch) {
                                // future open
                                if (
                                    best_state > 1 && (
                                        params.states == null ||
                                        params.states.contains(1)
                                    )
                                ) {
                                    best_state = 1;
                                    best_index = i;
                                }
                            }
                            else {
                                // future already closed
                                if (
                                    best_state > 3 && (
                                        params.states == null ||
                                        params.states.contains(3)
                                    )
                                ) {
                                    best_state = 3;
                                    best_index = i;
                                }
                            }
                        }
                    }

                    // Sorting script
                    if (params.use_case == "sorting") {
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
                            // Ordered by descending end of enrollment datetime. The course for
                            // which enrollment has ended last is displayed first.
                            return 4 * params.max_date - ZonedDateTime.parse(
                                params._source.course_runs[best_index]['enrollment_end'], formatter
                            ).toInstant().toEpochMilli();
                        }
                        else if (best_state == 5) {
                            // The course is archived
                            // Ordered by descending end datetime. The course that has finished
                            // last is displayed first.
                            return 5 * params.max_date - ZonedDateTime.parse(
                                params._source.course_runs[best_index]['end'], formatter
                            ).toInstant().toEpochMilli();
                        }
                        // The course has no course runs
                        return 6 * params.max_date;
                    }
                    // Field script
                    else if (params.use_case == 'field') {
                        if (best_state == 0) {
                            // The course is ongoing and open
                            // Return the date of end of enrollment
                            return [
                                'priority': 0,
                                'date_time': params._source.course_runs[best_index][
                                    'enrollment_end']
                            ];
                        }
                        else if (best_state == 1) {
                            // The course is future and open
                            // Return the start date
                            return [
                                'priority': 1,
                                'date_time': params._source.course_runs[best_index]['start']
                            ];
                        }
                        else if (best_state == 2) {
                            // The course is future but not yet open for enrollment
                            // Return the start date
                            return [
                                'priority': 2,
                                'date_time': params._source.course_runs[best_index]['start']
                            ];
                        }
                        else if (best_state == 3) {
                            // The course is future but already closed for enrollment
                            return ['priority': 3];
                        }
                        else if (best_state == 4) {
                            // The course is ongoing and closed for enrollment
                            return ['priority': 4];
                        }
                        else if (best_state == 5) {
                            // The course is archived
                            return ['priority': 5];
                        }
                        else {
                            // The course has no course runs
                            return ['priority': 6];
                        }
                    }
                """,
            }
        }
    }

    @classmethod
    def get_es_document_for_course(cls, course, index=None, action="index"):
        """
        Build an Elasticsearch document from the course instance.
        """
        index = index or cls.index_name

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

        # Prepare description texts
        descriptions = defaultdict(list)
        for simple_text in SimpleText.objects.filter(
            cmsplugin_ptr__placeholder__page=course.extended_object,
            cmsplugin_ptr__placeholder__slot="course_description",
        ):
            descriptions[simple_text.cmsplugin_ptr.language].append(simple_text.body)

        # Prepare categories, making sure we get title information for categories
        # in the same query
        category_pages = (
            course.get_root_to_leaf_category_pages()
            .select_related("node")
            .prefetch_related(
                Prefetch(
                    "title_set",
                    to_attr="published_titles",
                    queryset=Title.objects.filter(published=True),
                )
            )
            .only("node", "pk")
            .distinct()
        )

        # Prepare organizations, making sure we get title information for organizations
        # in the same query
        organizations = (
            course.get_organizations()
            .prefetch_related(
                Prefetch(
                    "extended_object__title_set",
                    to_attr="published_titles",
                    queryset=Title.objects.filter(published=True),
                )
            )
            .only("extended_object__node")
            .distinct()
        )

        # Prepare course runs
        # Ordering them by their `end` date is important to optimize sorting and other
        # computations that require looping on the course runs
        # Course runs with no start date or no start of enrollment date are ignored as
        # they are still to be scheduled.
        course_runs = [
            {
                "start": cr["start"],
                "end": cr["end"] or MAX_DATE,
                "enrollment_start": cr["enrollment_start"],
                "enrollment_end": cr["enrollment_end"] or cr["end"] or MAX_DATE,
                "languages": cr["languages"],
            }
            for cr in course.get_course_runs()
            .filter(start__isnull=False, enrollment_start__isnull=False)
            .order_by("-end")
            .values("start", "end", "enrollment_start", "enrollment_end", "languages")
        ]

        return {
            "_id": str(course.extended_object_id),
            "_index": index,
            "_op_type": action,
            "_type": cls.document_type,
            "absolute_url": {
                language: course.extended_object.get_absolute_url(language)
                for language in titles.keys()
            },
            "categories": [
                ES_INDICES.categories.get_es_id(page) for page in category_pages
            ],
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
            "description": {l: " ".join(st) for l, st in descriptions.items()},
            "is_new": len(course_runs) == 1,
            "organizations": [
                ES_INDICES.organizations.get_es_id(o.extended_object)
                for o in organizations
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
    def get_es_documents(cls, index=None, action="index"):
        """
        Loop on all the courses in database and format them for the ElasticSearch index
        """
        index = index or cls.index_name

        for course in Course.objects.filter(
            extended_object__publisher_is_draft=False,  # index the public object
            extended_object__title_set__published=True,  # only index published courses
            extended_object__node__parent__cms_pages__course__isnull=True,  # exclude snapshots
        ).distinct():
            yield cls.get_es_document_for_course(course, index=index, action=action)

    @staticmethod
    def format_es_object_for_api(es_course, language=None):
        """
        Format a course stored in ES into a consistent and easy-to-consume record for
        API consumers
        """
        language = language or translation.get_language()
        source = es_course["_source"]

        # Prepare the state
        state = es_course["fields"]["state"][0]
        try:
            state["date_time"] = datetime.fromisoformat(state["date_time"])
        except KeyError:
            state["date_time"] = None

        return {
            "id": es_course["_id"],
            "absolute_url": get_best_field_language(source["absolute_url"], language),
            "categories": source["categories"],
            "cover_image": get_best_field_language(source["cover_image"], language),
            "organization_highlighted": get_best_field_language(
                source["organizations_names"], language
            )[0],
            "organizations": source["organizations"],
            "state": CourseState(**state),
            "title": get_best_field_language(source["title"], language),
        }

    @staticmethod
    def format_es_document_for_autocomplete(es_document, language=None):
        """
        Format a document stored in ES into an easy-to-consume record for autocomplete consumers.
        This method differs from the regular one as objects retrieved from query VS complete
        queries can be formatted differently; and consumers of autocomplete do not need
        full objects.
        """
        return {
            "absolute_url": get_best_field_language(
                es_document["_source"]["absolute_url"], language
            ),
            "id": es_document["_id"],
            "title": get_best_field_language(es_document["_source"]["title"], language),
        }

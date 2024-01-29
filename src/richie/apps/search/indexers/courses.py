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

from richie.apps.search.indexers.organizations import OrganizationsIndexer
from richie.plugins.plain_text.models import PlainText
from richie.plugins.simple_picture.helpers import get_picture_info
from richie.plugins.simple_text_ckeditor.models import SimpleText

from ...courses.models import (
    MAX_DATE,
    CategoryPluginModel,
    Course,
    CourseRunCatalogVisibility,
    CourseState,
    Licence,
)
from ..defaults import ES_INDICES_PREFIX, ES_STATE_WEIGHTS
from ..forms import CourseSearchForm
from ..text_indexing import MULTILINGUAL_TEXT
from ..utils.i18n import get_best_field_language
from ..utils.indexers import get_course_pace, slice_string_for_completion

BEST_STATE_SCRIPT = """
    DateTimeFormatter formatter = DateTimeFormatter.ofPattern(
        "yyyy-MM-dd'T'HH:mm:ss[.SSSSSS]XXXXX"
    );
    int best_state = 7;
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
                        // on-going open
                        if (params.states == null || params.states.contains(0)) {
                            best_state = 0;
                            best_index = i;
                            // We already found the best... let's save iterations
                            break;
                        }
                    }
                    else {
                        // on-going closed
                        if (
                            best_state > 5 && (
                                params.states == null ||
                                params.states.contains(5)
                            )
                        ) {
                            best_state = 5;
                            best_index = i;
                        }
                    }
                }
                else {
                    if (enrollment_end > params.ms_since_epoch) {
                        // archived open
                        if (
                            best_state > 2 && (
                                params.states == null ||
                                params.states.contains(2)
                            )
                        ) {
                            best_state = 2;
                            best_index = i;
                            // Course runs are ordered by `end` date so we know all
                            // remaining course runs will not be better than
                            // archived open.
                            // Let's break to save iterations:
                            break;
                        }
                    }
                    else {
                        // archived closed
                        if (
                            best_state > 6 && (
                                params.states == null ||
                                params.states.contains(6)
                            )
                        ) {
                            best_state = 6;
                            best_index = i;
                        }
                    }
                }
            }
            else if (enrollment_start > params.ms_since_epoch) {
                // future not yet open
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
    }

"""


class CoursesIndexer:
    """
    Makes available the parameters the indexer requires as well as functions to shape
    objects getting into and out of ElasticSearch
    """

    index_name = f"{ES_INDICES_PREFIX}_courses"
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
            "licences": {"type": "keyword"},
            "organizations": {"type": "keyword"},
            "persons": {"type": "keyword"},
            # Searchable
            # description, title, category names & organization names are handled
            # by `MULTILINGUAL_TEXT`
            "code": {"type": "text", "analyzer": "code_trigram"},
            **{
                f"complete.{lang:s}": {
                    "type": "completion",
                    "analyzer": "simple_diacritics_insensitive",
                }
                for lang, _ in settings.LANGUAGES
            },
            # `persons_names` cannot be handled by `MULTILINGUAL_TEXT` because language
            # analyzers fail on people's names.
            **{
                "persons_names.{lang}": {"type": "text", "analyzer": "simple"}
                for lang, _ in settings.LANGUAGES
            },
            "is_new": {"type": "boolean"},
            "is_listed": {"type": "boolean"},
            # Not searchable
            "absolute_url": {"type": "object", "enabled": False},
            "cover_image": {"type": "object", "enabled": False},
            "icon": {"type": "object", "enabled": False},
            "organization_highlighted_cover_image": {
                "type": "object",
                "enabled": False,
            },
            "pace": {"type": "integer"},  # Expresses minutes per week
        },
    }
    display_fields = [
        "absolute_url",
        "categories",
        "code",
        "course_runs",
        "cover_image",
        "duration",
        "effort",
        "icon",
        "introduction",
        "organization_highlighted",
        "organization_highlighted_cover_image",
        "organizations",
        "title",
    ]
    form = CourseSearchForm

    scripts = {
        # The ordering process first splits the courses into 7 buckets (Bucket 0 to Bucket 6),
        # based on their state with further ordering inside each one of those buckets.
        #
        # The priority of each bucket is determined by a weight coming from the settings:
        #     > RICHIE_ES_STATE_WEIGHTS = [80, 40, 20, 10, 6, 5, 1]
        #
        # The priority of each course within a bucket is determined by a delta that is based on
        # one of the course's datetimes (start, end or end_of_enrollment date depending on its
        # state). This delta is added for dates later than the current datetime (in order to rank
        # them by ascending order), and substracted for dates earlier than the current time (in
        # order to rank them by descending order). Said differently, courses are ranked within a
        # bucket by the descending proximity of their signifiant datetime with the current
        # datetime.
        #
        # The boost factor for each course is given by the formula
        # (We add 1 to _score so that it is always > 0 and never brings boost factors to 0):
        #
        #     > boost_factor = (_score + 1) * (weight * now -/+ significant_datetime)
        #
        # Here's a schematic representation that shows the ordering factor for each
        # course (to be used in descending order later on) :
        #
        #                   TOP OF THE LIST
        #                   ———————————————
        # --------------------- weight_0 ---------------------
        #     Bucket 0: Courses that are on-going and open
        #      sorted by ascending end of enrollment date
        #
        # --------------------- weight_1 ---------------------
        #      Bucket 1: Courses that are future and open
        #            sorted by ascending start date
        #
        # --------------------- weight_2 ---------------------
        #      Bucket 2: Courses that are archived but open
        #       sorted by ascending end of enrollment date
        #
        # --------------------- weight_3 ---------------------
        #  Bucket 3: Courses that are future but not yet open
        #            sorted by ascending start date
        #
        # --------------------- weight_4 ---------------------
        # Bucket 4: Courses that are future but already closed
        #            sorted by ascending start date
        #
        # --------------------- weight_5 ---------------------
        #     Bucket 5: Courses that are on-going but closed
        #           sorted by ascending end date
        #
        # --------------------- weight_6 ---------------------
        #          Bucket 6: Courses that are archived
        #            sorted by descending end date
        #
        # ------------------ Weight set to 0 -----------------
        #      Bucket 7: Courses that have no course runs
        #                No specific ordering
        #                   ———————————————
        #                   END OF THE LIST
        #
        "score": {
            "script": {
                "lang": "painless",
                "source": BEST_STATE_SCRIPT
                # pylint: disable-next=consider-using-f-string
                + """
                if (best_state == 0) {{
                    // The course is on-going and open
                    // Ordered by ascending end of enrollment datetime. The next course to
                    // end enrollment is displayed first.
                    return (_score + 1) * (
                        {weight_0:d} * params.ms_since_epoch + Math.max(
                            0,
                            2 * params.ms_since_epoch - ZonedDateTime.parse(
                                params._source.course_runs[best_index]['enrollment_end'], formatter
                            ).toInstant().toEpochMilli()
                        )
                    );
                }}
                else if (best_state == 1) {{
                    // The course is future and open
                    // Ordered by starting datetime. The next course to start is displayed
                    // first.
                    return (_score + 1) * (
                        {weight_1:d} * params.ms_since_epoch + Math.max(
                            0,
                            2 * params.ms_since_epoch - ZonedDateTime.parse(
                                params._source.course_runs[best_index]['start'], formatter
                            ).toInstant().toEpochMilli()
                        )
                    );
                }}
                else if (best_state == 2) {{
                    // The course is archived but open for enrollment
                    // Ordered by ascending end of enrollment datetime. The next course to
                    // end enrollment is displayed first.
                    return (_score + 1) * (
                        {weight_2:d} * params.ms_since_epoch + Math.max(
                            0,
                            2 * params.ms_since_epoch - ZonedDateTime.parse(
                                params._source.course_runs[best_index]['enrollment_end'], formatter
                            ).toInstant().toEpochMilli()
                        )
                    );
                }}
                else if (best_state == 3) {{
                    // The course is future but not yet open for enrollment
                    // Ordered by starting datetime. The next course to start is displayed
                    // first.
                    return (_score + 1) * (
                        {weight_3:d} * params.ms_since_epoch + Math.max(
                            0,
                            2 * params.ms_since_epoch - ZonedDateTime.parse(
                                params._source.course_runs[best_index]['start'], formatter
                            ).toInstant().toEpochMilli()
                        )
                    );
                }}
                else if (best_state == 4) {{
                    // The course is future but already closed for enrollment
                    // Ordered by end datetime. The next course to end is displayed first
                    return (_score + 1) * (
                        {weight_4:d} * params.ms_since_epoch + Math.max(
                            0,
                            2 * params.ms_since_epoch - ZonedDateTime.parse(
                                params._source.course_runs[best_index]['start'], formatter
                            ).toInstant().toEpochMilli()
                        )
                    );
                }}
                else if (best_state == 5) {{
                    // The course is on-going and closed for enrollment
                    // Ordered by end datetime. The next course to end is displayed first
                    return (_score + 1) * (
                        {weight_5:d} * params.ms_since_epoch + Math.max(
                            0,
                            2 * params.ms_since_epoch - ZonedDateTime.parse(
                                params._source.course_runs[best_index]['end'], formatter
                            ).toInstant().toEpochMilli()
                        )
                    );
                }}
                else if (best_state == 6) {{
                    // The course is archived and closed for enrollment
                    // Ordered by end datetime. The next course to start is displayed
                    // first.
                    return (_score + 1) * (
                        {weight_6:d} * params.ms_since_epoch + ZonedDateTime.parse(
                            params._source.course_runs[best_index]['end'], formatter
                        ).toInstant().toEpochMilli()
                    );
                }}
                // The course has no course runs
                return 0;
                """.format(
                    **{
                        f"weight_{i:d}": weight
                        for i, weight in enumerate(ES_STATE_WEIGHTS)
                    }
                ),
            }
        },
        # Compute a course's state based on the current state of each of its course runs.
        "state_field": {
            "script": {
                "lang": "painless",
                "source": BEST_STATE_SCRIPT
                + """
                if (best_state == 0) {
                    // The course is on-going and open
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
                    // The course is archived but open
                    // Return the date of end of enrollment
                    return [
                        'priority': 2,
                        'date_time': params._source.course_runs[best_index][
                            'enrollment_end']
                    ];
                }
                else if (best_state == 3) {
                    // The course is future but not yet open for enrollment
                    // Return the start date
                    return [
                        'priority': 3,
                        'date_time': params._source.course_runs[best_index]['start']
                    ];
                }
                else if (best_state == 4) {
                    // The course is future but already closed for enrollment
                    return ['priority': 4];
                }
                else if (best_state == 5) {
                    // The course is on-going and closed for enrollment
                    return ['priority': 5];
                }
                else if (best_state == 6) {
                    // The course is archived
                    return ['priority': 6];
                }
                else {
                    // The course has no course runs
                    return ['priority': 7];
                }
                """,
            }
        },
    }

    # pylint: disable=too-many-locals
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
        for cover in Picture.objects.filter(
            cmsplugin_ptr__placeholder__page=course.extended_object,
            cmsplugin_ptr__placeholder__slot="course_cover",
        ):
            language = cover.cmsplugin_ptr.language
            with translation.override(language):
                picture_info = get_picture_info(cover, "cover")
                if picture_info:
                    cover_images[language] = picture_info

        # Prepare the related category icon
        icon_images = {}
        for plugin_model in CategoryPluginModel.objects.filter(
            cmsplugin_ptr__placeholder__page=course.extended_object_id,
            cmsplugin_ptr__placeholder__slot="course_icons",
            cmsplugin_ptr__position=0,
        ):
            language = plugin_model.language
            for icon in Picture.objects.filter(
                cmsplugin_ptr__language=language,
                cmsplugin_ptr__placeholder__page=plugin_model.page_id,
                cmsplugin_ptr__placeholder__slot="icon",
                cmsplugin_ptr__position=0,
            ):
                with translation.override(language):
                    picture_info = get_picture_info(icon, "icon") or {}
                    icon_images[language] = {
                        **picture_info,
                        "color": plugin_model.page.category.color,
                        "title": plugin_model.page.get_title(),
                    }

        # Prepare description texts
        descriptions = defaultdict(list)
        for simple_text in SimpleText.objects.filter(
            cmsplugin_ptr__placeholder__page=course.extended_object,
            cmsplugin_ptr__placeholder__slot="course_description",
        ):
            descriptions[simple_text.cmsplugin_ptr.language].append(simple_text.body)

        # Prepare introduction texts
        introductions = defaultdict(list)
        for plain_text in PlainText.objects.filter(
            cmsplugin_ptr__placeholder__page=course.extended_object,
            cmsplugin_ptr__placeholder__slot="course_introduction",
        ):
            introductions[plain_text.cmsplugin_ptr.language].append(plain_text.body)

        # Prepare localized duration texts
        duration = {}
        for language, _ in settings.LANGUAGES:
            with translation.override(language):
                duration[language] = course.get_duration_display()

        # Prepare localized effort texts
        effort = {}
        for language, _ in settings.LANGUAGES:
            with translation.override(language):
                effort[language] = course.get_effort_display()

        # Prepare categories, making sure we get title information for categories
        # in the same query
        category_pages = (
            course.get_root_to_leaf_public_category_pages()
            .prefetch_related(
                Prefetch(
                    "title_set",
                    to_attr="published_titles",
                    queryset=Title.objects.filter(published=True),
                )
            )
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
            .distinct()
        )
        organization_main = course.get_main_organization()
        organization_highlighted = (
            organizations.get(id=organization_main.id) if organization_main else None
        )
        organization_highlighted_cover_image = (
            OrganizationsIndexer.get_logo_images(organization_main)
            if organization_main
            else {}
        )

        # Prepare persons, making sure we get title information for persons
        # in the same query
        persons = (
            course.get_persons()
            .prefetch_related(
                Prefetch(
                    "extended_object__title_set",
                    to_attr="published_titles",
                    queryset=Title.objects.filter(published=True),
                )
            )
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
            for cr in course.course_runs.filter(
                start__isnull=False,
                enrollment_start__isnull=False,
                catalog_visibility=CourseRunCatalogVisibility.COURSE_AND_SEARCH,
            )
            .order_by("-end")
            .values("start", "end", "enrollment_start", "enrollment_end", "languages")
        ]

        licences = (
            Licence.objects.filter(
                licencepluginmodel__cmsplugin_ptr__placeholder__page__course=course,
                licencepluginmodel__cmsplugin_ptr__placeholder__slot="course_license_content",
            )
            .distinct()
            .order_by("id")
            .values_list("id", flat=True)
        )

        return {
            "_id": course.get_es_id(),
            "_index": index,
            "_op_type": action,
            "absolute_url": {
                lang: course.extended_object.get_absolute_url(lang)
                for lang, _ in settings.LANGUAGES
            },
            "categories": [page.category.get_es_id() for page in category_pages],
            # Index the names of categories to surface them in full text searches
            "categories_names": reduce(
                lambda acc, title: {
                    **acc,
                    title.language: (
                        acc[title.language] + [title.title]
                        if acc.get(title.language)
                        else [title.title]
                    ),
                },
                [title for page in category_pages for title in page.published_titles],
                {},
            ),
            "code": course.code,
            "complete": (
                {
                    language: slice_string_for_completion(title)
                    for language, title in titles.items()
                }
                if course.is_listed
                else None
            ),
            "course_runs": course_runs,
            "cover_image": cover_images,
            "description": {
                language: " ".join(st) for language, st in descriptions.items()
            },
            "duration": duration,
            "effort": effort,
            "icon": icon_images,
            "introduction": {
                language: " ".join(st) for language, st in introductions.items()
            },
            "is_new": len(course_runs) == 1,
            # If titles is an empty dict, it means the course is not published in any language:
            "is_listed": bool(course.is_listed and titles),
            "licences": list(licences),
            # Pick the highlighted organization from the organizations QuerySet to benefit from
            # the prefetch of related title sets
            "organization_highlighted": (
                {
                    title.language: (
                        title.menu_title if title.menu_title else title.title
                    )
                    for title in organization_highlighted.extended_object.published_titles
                }
                if organization_highlighted
                else None
            ),
            "organization_highlighted_cover_image": organization_highlighted_cover_image,
            "organizations": [
                organization.get_es_id() for organization in organizations
            ],
            # Index the names of organizations to surface them in full text searches
            "organizations_names": reduce(
                lambda acc, title: {
                    **acc,
                    title.language: (
                        acc[title.language] + [title.title]
                        if acc.get(title.language)
                        else [title.title]
                    ),
                },
                [
                    title
                    for organization in organizations
                    for title in organization.extended_object.published_titles
                ],
                {},
            ),
            "persons": [person.get_es_id() for person in persons],
            "persons_names": reduce(
                lambda acc, title: {
                    **acc,
                    title.language: (
                        acc[title.language] + [title.title]
                        if acc.get(title.language)
                        else [title.title]
                    ),
                },
                [
                    title
                    for person in persons
                    for title in person.extended_object.published_titles
                ],
                {},
            ),
            "pace": (
                None
                if course.is_self_paced
                else get_course_pace(course.effort, course.duration)
            ),
            "title": titles,
        }

    @classmethod
    def get_es_documents(cls, index=None, action="index"):
        """
        Loop on all the courses in database and format them for the ElasticSearch index
        """
        index = index or cls.index_name

        for course in (
            Course.objects.filter(
                extended_object__publisher_is_draft=False,  # index the public object
                extended_object__title_set__published=True,  # only index published courses
                extended_object__node__parent__cms_pages__course__isnull=True,  # exclude snapshots
            )
            .distinct()
            .iterator()
        ):
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
            **{
                field: get_best_field_language(source[field], language)
                for field in [
                    "absolute_url",
                    "cover_image",
                    "duration",
                    "effort",
                    "icon",
                    "introduction",
                    "title",
                ]
            },
            "id": es_course["_id"],
            "categories": source["categories"],
            "code": source["code"],
            "course_runs": source["course_runs"],
            "organization_highlighted": (
                get_best_field_language(source["organization_highlighted"], language)
                if source.get("organization_highlighted", None)
                else None
            ),
            "organization_highlighted_cover_image": (
                get_best_field_language(
                    source["organization_highlighted_cover_image"], language
                )
                if source.get("organization_highlighted_cover_image", None)
                else None
            ),
            "organizations": source["organizations"],
            "state": CourseState(**state),
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
            "kind": "courses",
            "title": get_best_field_language(es_document["_source"]["title"], language),
        }

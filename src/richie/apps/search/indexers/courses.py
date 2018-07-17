"""
ElasticSearch course document management utilities
"""
from django.conf import settings

from ..exceptions import IndexerDataException
from ..partial_mappings import MULTILINGUAL_TEXT
from ..utils.api_consumption import walk_api_json_list
from ..utils.i18n import get_best_field_language


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
            "end_date": {"type": "date"},
            "enrollment_end_date": {"type": "date"},
            "enrollment_start_date": {"type": "date"},
            "language": {"type": "keyword"},
            "organizations": {"type": "keyword"},
            "session_number": {"type": "integer"},
            "start_date": {"type": "date"},
            "subjects": {"type": "keyword"},
            "thumbnails": {
                "properties": {
                    "about": {"type": "text", "index": False},
                    "big": {"type": "text", "index": False},
                    "facebook": {"type": "text", "index": False},
                    "small": {"type": "text", "index": False},
                },
                "type": "object",
            },
        },
    }

    @classmethod
    def get_data_for_es(cls, index, action):
        """
        Load all the courses from the API and format them for the ElasticSearch index
        """
        content_pages = walk_api_json_list(settings.COURSE_API_ENDPOINT)

        for content_page in content_pages:
            try:
                for course in content_page["results"]:
                    yield {
                        "_id": course["id"],
                        "_index": index,
                        "_op_type": action,
                        "_type": cls.document_type,
                        "end_date": course["end_date"],
                        "enrollment_end_date": course["enrollment_end_date"],
                        "enrollment_start_date": course["enrollment_start_date"],
                        "language": course["language"],
                        "organization_main": course["main_university"]["id"],
                        "organizations": [org["id"] for org in course["universities"]],
                        "session_number": course["session_number"],
                        "short_description": {
                            course["language"]: course["short_description"]
                        },
                        "start_date": course["start_date"],
                        "subjects": [subject["id"] for subject in course["subjects"]],
                        "thumbnails": course["thumbnails"],
                        "title": {course["language"]: course["title"]},
                    }
            except KeyError:
                raise IndexerDataException("Unexpected data shape in courses to index")

    @staticmethod
    def format_es_course_for_api(es_course, best_language):
        """
        Format a course stored in ES into a consistent and easy-to-consume record for
        API consumers
        """
        return {
            "end_date": es_course["_source"]["end_date"],
            "enrollment_end_date": es_course["_source"]["enrollment_end_date"],
            "enrollment_start_date": es_course["_source"]["enrollment_start_date"],
            "id": es_course["_id"],
            "language": es_course["_source"]["language"],
            "organization_main": es_course["_source"]["organization_main"],
            "organizations": es_course["_source"]["organizations"],
            "session_number": es_course["_source"]["session_number"],
            "short_description": get_best_field_language(
                es_course["_source"]["short_description"], best_language
            ),
            "start_date": es_course["_source"]["start_date"],
            "subjects": es_course["_source"]["subjects"],
            "thumbnails": es_course["_source"]["thumbnails"],
            "title": get_best_field_language(
                es_course["_source"]["title"], best_language
            ),
        }

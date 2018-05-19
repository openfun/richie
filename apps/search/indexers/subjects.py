"""
ElasticSearch subject document management utilities
"""
from django.conf import settings

from ..partial_mappings import MULTILINGUAL_TEXT
from ..exceptions import IndexerDataException
from ..utils.api_consumption import walk_api_json_list
from ..utils.i18n import get_best_field_language


class SubjectsIndexer:
    """
    Makes available the parameters the indexer requires as well as functions to shape
    objects getting into and out of ElasticSearch
    """
    document_type = "subject"
    index_name = "richie_subjects"
    mapping = {
        "dynamic_templates": MULTILINGUAL_TEXT,
        "properties": {"image": {"type": "text", "index": False}},
    }

    def get_data_for_es(self, index, action):
        """
        Load all the subjects from the API and format them for the ElasticSearch index
        """
        content_pages = walk_api_json_list(settings.SUBJECT_API_ENDPOINT)

        for content_page in content_pages:
            try:
                for subject in content_page["results"]:
                    yield {
                        "_id": subject["id"],
                        "_index": index,
                        "_op_type": action,
                        "_type": self.document_type,
                        "image": subject["image"],
                        "name": {"fr": subject["name"]},
                    }
            except KeyError:
                raise IndexerDataException("Unexpected data shape in subjects to index")

    @staticmethod
    def format_es_subject_for_api(es_subject, best_language):
        """
        Format a subject stored in ES into a consistent and easy-to-consume record for
        API consumers
        """
        return {
            "id": es_subject["_id"],
            "image": es_subject["_source"]["image"],
            "name": get_best_field_language(
                es_subject["_source"]["name"], best_language
            ),
        }

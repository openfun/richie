"""
ElasticSearch subject document management utilities
"""
from django.conf import settings

from ..exceptions import IndexerDataException, QueryFormatException
from ..forms import SubjectListForm
from ..partial_mappings import MULTILINGUAL_TEXT
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

    @classmethod
    def get_data_for_es(cls, index, action):
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
                        "_type": cls.document_type,
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

    @staticmethod
    def build_es_query(request):
        """
        Build an ElasticSearch query and its related aggregations, to be consumed by the ES client
        in the Subjects ViewSet
        """
        # Instantiate a form with our query_params to check & sanitize them
        params_form = SubjectListForm(request.query_params)

        # Raise an exception with error information if the query params are not valid
        if not params_form.is_valid():
            raise QueryFormatException(params_form.errors)

        # Build a query that matches on the name field if it was handed by the client
        # Note: test_elasticsearch_feature.py needs to be updated whenever the search call
        # is updated and makes use new features.
        if params_form.cleaned_data.get("query"):
            query = {
                "query": {
                    "match": {
                        "name.fr": {
                            "query": params_form.cleaned_data.get("query"),
                            "analyzer": "french",
                        }
                    }
                }
            }
        # Build a match_all query by default
        else:
            query = {"query": {"match_all": {}}}

        return (
            params_form.cleaned_data.get("limit"),
            params_form.cleaned_data.get("offset") or 0,
            query,
        )

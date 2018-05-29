"""
ElasticSearch organization document management utilities
"""
from django.conf import settings

from ..exceptions import IndexerDataException
from ..partial_mappings import MULTILINGUAL_TEXT
from ..utils.api_consumption import walk_api_json_list
from ..utils.i18n import get_best_field_language


class OrganizationsIndexer:
    """
    Makes available the parameters the indexer requires as well as a function to shape
    objects into what we want to index in ElasticSearch
    """

    document_type = "organization"
    index_name = "richie_organizations"
    mapping = {
        "dynamic_templates": MULTILINGUAL_TEXT,
        "properties": {
            "banner": {"type": "text", "index": False},
            "code": {"type": "keyword"},
            "logo": {"type": "text", "index": False},
        },
    }

    def get_data_for_es(self, index, action):
        """
        Load all the organizations from the API and format them for the ElasticSearch index
        """
        content_pages = walk_api_json_list(settings.ORGANIZATION_API_ENDPOINT)

        for content_page in content_pages:
            try:
                for organization in content_page["results"]:
                    yield {
                        "_id": organization["id"],
                        "_index": index,
                        "_op_type": action,
                        "_type": self.document_type,
                        "banner": organization["banner"],
                        "code": organization["code"],
                        "logo": organization["logo"],
                        "name": {"fr": organization["name"]},
                    }
            except KeyError:
                raise IndexerDataException(
                    "Unexpected data shape in organizations to index"
                )

    @staticmethod
    def format_es_organization_for_api(es_organization, best_language):
        """
        Format an organization stored in ES into a consistent and easy-to-consume record for
        API consumers
        """
        return {
            "banner": es_organization["_source"]["banner"],
            "code": es_organization["_source"]["code"],
            "id": es_organization["_id"],
            "logo": es_organization["_source"]["logo"],
            "name": get_best_field_language(
                es_organization["_source"]["name"], best_language
            ),
        }

"""
ElasticSearch licence document management utilities
"""

from django.conf import settings

from ...courses.models import Licence
from ..defaults import ES_INDICES_PREFIX
from ..forms import LicenceSearchForm
from ..text_indexing import MULTILINGUAL_TEXT
from ..utils.i18n import get_best_field_language
from ..utils.indexers import slice_string_for_completion


class LicencesIndexer:
    """
    Makes available the parameters the indexer requires as well as a function to shape
    objects into what we want to index in ElasticSearch
    """

    index_name = f"{ES_INDICES_PREFIX}_licences"
    form = LicenceSearchForm
    mapping = {
        "dynamic_templates": MULTILINGUAL_TEXT,
        "properties": {
            # Searchable description & title are handled by `MULTILINGUAL_TEXT`
            **{
                f"complete.{lang:s}": {
                    "type": "completion",
                    "analyzer": "simple_diacritics_insensitive",
                }
                for lang, _ in settings.LANGUAGES
            },
            # Create a raw title field to enable alphabetical sorting
            # We cannot use the default title field as the analysis prevents sorting on it
            **{
                f"title_raw.{lang}": {"type": "keyword"}
                for lang, _ in settings.LANGUAGES
            },
        },
    }
    scripts = {}
    display_fields = ["id", "title"]

    @classmethod
    def get_es_document_for_licence(cls, licence, index=None, action="index"):
        """Build an Elasticsearch document from the licence instance."""
        index = index or cls.index_name

        translations = licence.translations.all()

        titles = {
            translation.language_code: translation.name for translation in translations
        }

        return {
            "_id": licence.id,
            "_index": index,
            "_op_type": action,
            "complete": {
                language_code: slice_string_for_completion(name)
                for language_code, name in titles.items()
            },
            "content": {
                translation.language_code: translation.content
                for translation in translations
            },
            "title": titles,
            "title_raw": titles,
        }

    @classmethod
    def get_es_documents(cls, index=None, action="index"):
        """
        Loop on all the liences in database and format them for the ElasticSearch index
        """
        index = index or cls.index_name

        for licence in Licence.objects.prefetch_related("translations").iterator():
            yield cls.get_es_document_for_licence(licence, index=index, action=action)

    @staticmethod
    def format_es_object_for_api(es_licence, best_language):
        """
        Format a licence stored in ES into a consistent and easy-to-consume record for
        API consumers
        """
        return {
            "id": es_licence["_id"],
            "title": get_best_field_language(
                es_licence["_source"]["title"], best_language
            ),
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
            "id": es_document["_id"],
            "kind": "licences",
            "title": get_best_field_language(es_document["_source"]["title"], language),
        }

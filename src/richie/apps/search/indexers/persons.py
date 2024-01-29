"""
ElasticSearch person document management utilities
"""

from collections import defaultdict

from django.conf import settings
from django.utils import translation

from cms.models import Title
from djangocms_picture.models import Picture

from richie.plugins.simple_picture.helpers import get_picture_info
from richie.plugins.simple_text_ckeditor.models import SimpleText

from ...courses.models import Person
from ..defaults import ES_INDICES_PREFIX
from ..forms import ItemSearchForm
from ..text_indexing import MULTILINGUAL_TEXT
from ..utils.i18n import get_best_field_language
from ..utils.indexers import slice_string_for_completion


class PersonsIndexer:
    """
    Makes available the parameters the indexer requires as well as a function to shape
    objects into what we want to index in ElasticSearch
    """

    index_name = f"{ES_INDICES_PREFIX}_persons"
    form = ItemSearchForm
    mapping = {
        "dynamic_templates": MULTILINGUAL_TEXT,
        "properties": {
            # Searchable
            **{
                f"complete.{lang:s}": {
                    "type": "completion",
                    "analyzer": "simple_diacritics_insensitive",
                }
                for lang, _ in settings.LANGUAGES
            },
            **{
                "{key}.{lang}": {"type": "text", "analyzer": "simple"}
                for lang, _ in settings.LANGUAGES
                for key in ["bio", "title"]
            },
            # Not searchable
            "absolute_url": {"type": "object", "enabled": False},
            "portrait": {"type": "object", "enabled": False},
            # Create a raw title field to enable alphabetical sorting
            # We cannot use the default title field as the analysis prevents sorting on it
            **{
                f"title_raw.{lang}": {"type": "keyword"}
                for lang, _ in settings.LANGUAGES
            },
        },
    }
    scripts = {}
    display_fields = ["absolute_url", "portrait", "title"]

    @classmethod
    def get_es_document_for_person(cls, person, index=None, action="index"):
        """Build an Elasticsearch document from the person instance."""
        index = index or cls.index_name

        # Get published titles
        titles = {
            t.language: t.title
            for t in Title.objects.filter(page=person.extended_object, published=True)
        }

        # Prepare portrait images
        portrait_images = {}
        for portrait in Picture.objects.filter(
            cmsplugin_ptr__placeholder__page=person.extended_object,
            cmsplugin_ptr__placeholder__slot="portrait",
        ):
            language = portrait.cmsplugin_ptr.language
            with translation.override(language):
                portrait_images[language] = get_picture_info(portrait, "portrait")

        # Get bio texts
        bio = defaultdict(list)
        for simple_text in SimpleText.objects.filter(
            cmsplugin_ptr__placeholder__page=person.extended_object,
            cmsplugin_ptr__placeholder__slot="bio",
        ):
            bio[simple_text.cmsplugin_ptr.language].append(simple_text.body)

        return {
            "_id": str(person.extended_object_id),
            "_index": index,
            "_op_type": action,
            "absolute_url": {
                lang: person.extended_object.get_absolute_url(lang)
                for lang, _ in settings.LANGUAGES
            },
            "bio": {language: " ".join(st) for language, st in bio.items()},
            "complete": {
                language: slice_string_for_completion(title)
                for language, title in titles.items()
            },
            "portrait": portrait_images,
            "title": titles,
            "title_raw": titles,
        }

    @classmethod
    def get_es_documents(cls, index=None, action="index"):
        """
        Loop on all the persons in database and format them for the ElasticSearch index
        """
        index = index or cls.index_name

        for person in (
            Person.objects.filter(
                extended_object__publisher_is_draft=False,
                extended_object__title_set__published=True,
            )
            .distinct()
            .iterator()
        ):
            yield cls.get_es_document_for_person(person, index=index, action=action)

    @staticmethod
    def format_es_object_for_api(es_person, best_language):
        """
        Format an person stored in ES into a consistent and easy-to-consume record for
        API consumers
        """
        return {
            "id": es_person["_id"],
            "portrait": get_best_field_language(
                es_person["_source"]["portrait"], best_language
            ),
            "title": get_best_field_language(
                es_person["_source"]["title"], best_language
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
            "kind": "persons",
            "title": get_best_field_language(es_document["_source"]["title"], language),
        }

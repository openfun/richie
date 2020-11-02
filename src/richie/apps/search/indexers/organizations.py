"""
ElasticSearch organization document management utilities
"""
from collections import defaultdict

from django.conf import settings
from django.utils import translation

from cms.models import Title
from djangocms_picture.models import Picture

from richie.plugins.simple_picture.helpers import get_picture_info
from richie.plugins.simple_text_ckeditor.models import SimpleText

from ...courses.models import Organization
from ..defaults import ES_INDICES_PREFIX
from ..forms import ItemSearchForm
from ..text_indexing import MULTILINGUAL_TEXT
from ..utils.i18n import get_best_field_language
from ..utils.indexers import slice_string_for_completion


class OrganizationsIndexer:
    """
    Makes available the parameters the indexer requires as well as a function to shape
    objects into what we want to index in ElasticSearch
    """

    document_type = "organization"
    index_name = f"{ES_INDICES_PREFIX}_organizations"
    form = ItemSearchForm
    mapping = {
        "dynamic_templates": MULTILINGUAL_TEXT,
        "properties": {
            # Searchable
            # description & title are handled by `MULTILINGUAL_TEXT`
            **{
                "complete.{:s}".format(lang): {
                    "type": "completion",
                    "analyzer": "simple_diacritics_insensitive",
                }
                for lang, _ in settings.LANGUAGES
            },
            # Not searchable
            "absolute_url": {"type": "object", "enabled": False},
            "logo": {"type": "object", "enabled": False},
        },
    }
    scripts = {}
    display_fields = ["absolute_url", "logo", "title.*"]

    @classmethod
    def get_es_document_for_organization(cls, organization, index=None, action="index"):
        """Build an Elasticsearch document from the category instance."""
        index = index or cls.index_name

        # Get published titles
        titles = {
            t.language: t.title
            for t in Title.objects.filter(
                page=organization.extended_object, published=True
            )
        }

        # Prepare logo images
        logo_images = {}
        for logo in Picture.objects.filter(
            cmsplugin_ptr__placeholder__page=organization.extended_object,
            cmsplugin_ptr__placeholder__slot="logo",
        ):
            language = logo.cmsplugin_ptr.language
            with translation.override(language):
                logo_images[language] = get_picture_info(logo, "logo")

        # Get description texts
        description = defaultdict(list)
        for simple_text in SimpleText.objects.filter(
            cmsplugin_ptr__placeholder__page=organization.extended_object,
            cmsplugin_ptr__placeholder__slot="description",
        ):
            description[simple_text.cmsplugin_ptr.language].append(simple_text.body)

        return {
            "_id": organization.get_es_id(),
            "_index": index,
            "_op_type": action,
            "_type": cls.document_type,
            "absolute_url": {
                language: organization.extended_object.get_absolute_url(language)
                for language in titles.keys()
            },
            "complete": {
                language: slice_string_for_completion(title)
                for language, title in titles.items()
            },
            "logo": logo_images,
            "description": {
                language: " ".join(st) for language, st in description.items()
            },
            "title": titles,
        }

    @classmethod
    def get_es_documents(cls, index=None, action="index"):
        """
        Loop on all the organizations in database and format them for the ElasticSearch index
        """
        index = index or cls.index_name

        for organization in (
            Organization.objects.filter(
                extended_object__publisher_is_draft=False,
                extended_object__title_set__published=True,
            )
            .distinct()
            .iterator()
        ):
            yield cls.get_es_document_for_organization(
                organization, index=index, action=action
            )

    @staticmethod
    def format_es_object_for_api(es_organization, best_language):
        """
        Format an organization stored in ES into a consistent and easy-to-consume record for
        API consumers
        """
        return {
            "id": es_organization["_id"],
            "logo": get_best_field_language(
                es_organization["_source"]["logo"], best_language
            ),
            "title": get_best_field_language(
                es_organization["_source"]["title"], best_language
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
            "kind": "organizations",
            "title": get_best_field_language(es_document["_source"]["title"], language),
        }

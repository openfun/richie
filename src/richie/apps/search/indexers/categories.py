"""
ElasticSearch category document management utilities
"""
from collections import defaultdict

from django.conf import settings
from django.utils import translation

from cms.models import Title
from djangocms_picture.models import Picture

from richie.plugins.simple_picture.helpers import get_picture_info
from richie.plugins.simple_text_ckeditor.models import SimpleText

from ...courses.models import Category
from ..defaults import ES_INDICES_PREFIX
from ..forms import ItemSearchForm
from ..text_indexing import MULTILINGUAL_TEXT
from ..utils.i18n import get_best_field_language
from ..utils.indexers import slice_string_for_completion


class CategoriesIndexer:
    """
    Makes available the parameters the indexer requires as well as functions to shape
    objects getting into and out of ElasticSearch
    """

    document_type = "category"
    index_name = f"{ES_INDICES_PREFIX}_categories"
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
                    # Allow filtering autocomplete results with a kindkey to match the value of
                    # the `kind` field of the object
                    "contexts": [{"name": "kind", "type": "category", "path": "kind"}],
                }
                for lang, _ in settings.LANGUAGES
            },
            "is_meta": {"type": "boolean"},
            "kind": {"type": "keyword"},
            "nb_children": {"type": "integer"},
            "path": {"type": "keyword"},
            # Not searchable
            "absolute_url": {"type": "object", "enabled": False},
            "logo": {"type": "object", "enabled": False},
            "icon": {"type": "object", "enabled": False},
        },
    }
    scripts = {}
    display_fields = [
        "absolute_url",
        "icon",
        "is_meta",
        "logo",
        "nb_children",
        "path",
        "title.*",
    ]

    @classmethod
    def get_es_document_for_category(cls, category, index=None, action="index"):
        """Build an Elasticsearch document from the category instance."""
        index = index or cls.index_name

        # Prepare published titles
        titles = {
            t.language: t.title
            for t in Title.objects.filter(page=category.extended_object, published=True)
        }

        # Prepare logo images
        logo_images = {}
        for logo in Picture.objects.filter(
            cmsplugin_ptr__placeholder__page=category.extended_object,
            cmsplugin_ptr__placeholder__slot="logo",
        ):
            language = logo.cmsplugin_ptr.language
            with translation.override(language):
                logo_images[language] = get_picture_info(logo, "logo")

        # Prepare icon images
        icon_images = {}
        for icon in Picture.objects.filter(
            cmsplugin_ptr__placeholder__page=category.extended_object,
            cmsplugin_ptr__placeholder__slot="icon",
        ):
            language = icon.cmsplugin_ptr.language
            with translation.override(language):
                icon_images[language] = get_picture_info(icon, "icon")

        # Prepare description texts
        description = defaultdict(list)
        for simple_text in SimpleText.objects.filter(
            cmsplugin_ptr__placeholder__page=category.extended_object,
            cmsplugin_ptr__placeholder__slot="description",
        ):
            description[simple_text.cmsplugin_ptr.language].append(simple_text.body)

        # Shorcut to the category's page node
        node = category.extended_object.node

        # Find the meta category the current category falls under
        try:
            kind = category.get_meta_category().extended_object.reverse_id
        except Category.DoesNotExist:
            # Meta categories do not have a meta category themselves
            kind = None

        return {
            "_id": category.get_es_id(),
            "_index": index,
            "_op_type": action,
            "_type": cls.document_type,
            "absolute_url": {
                language: category.extended_object.get_absolute_url(language)
                for language in titles.keys()
            },
            "complete": {
                language: slice_string_for_completion(title)
                for language, title in titles.items()
            },
            "description": {
                language: " ".join(st) for language, st in description.items()
            },
            "icon": icon_images,
            "is_meta": bool(
                node.parent is None
                or node.parent.cms_pages.filter(category__isnull=True).exists()
            ),
            "kind": kind,
            "logo": logo_images,
            "nb_children": node.numchild,
            "path": node.path,
            "title": titles,
        }

    @classmethod
    def get_es_documents(cls, index=None, action="index"):
        """
        Loop on all the categories in database and format them for the ElasticSearch index
        """
        index = index or cls.index_name

        for category in (
            Category.objects.filter(
                extended_object__publisher_is_draft=False,
                extended_object__title_set__published=True,
            )
            .distinct()
            .iterator()
        ):
            yield cls.get_es_document_for_category(category, index=index, action=action)

    @staticmethod
    def format_es_object_for_api(es_category, best_language):
        """
        Format an category stored in ES into a consistent and easy-to-consume record for
        API consumers
        """
        source = es_category["_source"]
        return {
            "icon": get_best_field_language(source["icon"], best_language),
            "id": es_category["_id"],
            "is_meta": source["is_meta"],
            "logo": get_best_field_language(source["logo"], best_language),
            "nb_children": source["nb_children"],
            "path": source["path"],
            "title": get_best_field_language(source["title"], best_language),
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
            "kind": "categories",
            "title": get_best_field_language(es_document["_source"]["title"], language),
        }

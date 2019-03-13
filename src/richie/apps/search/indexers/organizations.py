"""
ElasticSearch organization document management utilities
"""
from collections import defaultdict

from django.conf import settings
from django.db.models import Prefetch

from cms.models import Title
from djangocms_picture.models import Picture

from richie.plugins.simple_text_ckeditor.models import SimpleText

from ...courses.models import Organization
from .. import defaults
from ..forms import ItemSearchForm
from ..partial_mappings import MULTILINGUAL_TEXT
from ..utils.i18n import get_best_field_language
from ..utils.indexers import slice_string_for_completion


class OrganizationsIndexer:
    """
    Makes available the parameters the indexer requires as well as a function to shape
    objects into what we want to index in ElasticSearch
    """

    document_type = "organization"
    index_name = "richie_organizations"
    form = ItemSearchForm
    mapping = {
        "dynamic_templates": MULTILINGUAL_TEXT,
        "properties": {
            # Searchable
            **{
                "complete.{:s}".format(lang): {"type": "completion"}
                for lang, _ in settings.LANGUAGES
            },
            "description": {"type": "object"},
            "title": {"type": "object"},
            # Not searchable
            "absolute_url": {"type": "object", "enabled": False},
            "logo": {"type": "object", "enabled": False},
        },
    }
    scripts = {}
    display_fields = ["absolute_url", "logo", "title.*"]

    @classmethod
    def get_es_documents(cls, index, action):
        """
        Load all the organizations from the Organization model and format them for the
        ElasticSearch index.
        """
        for organization in (
            Organization.objects.filter(
                extended_object__publisher_is_draft=False,
                extended_object__title_set__published=True,
            )
            .prefetch_related(
                Prefetch(
                    "extended_object__title_set",
                    to_attr="published_titles",
                    queryset=Title.objects.filter(published=True),
                )
            )
            .distinct()
        ):
            # Get published titles
            titles = {
                t.language: t.title
                for t in organization.extended_object.published_titles
            }

            # Get logo images
            logo_images = {}
            for logo_image in Picture.objects.filter(
                cmsplugin_ptr__placeholder__page=organization.extended_object,
                cmsplugin_ptr__placeholder__slot="logo",
            ):
                # Force the image format before computing it
                logo_image.use_no_cropping = False
                logo_image.width = defaults.ORGANIZATIONS_LOGO_IMAGE_WIDTH
                logo_image.height = defaults.ORGANIZATIONS_LOGO_IMAGE_HEIGHT
                logo_images[logo_image.cmsplugin_ptr.language] = logo_image.img_src

            # Get syllabus texts
            description = defaultdict(list)
            for simple_text in SimpleText.objects.filter(
                cmsplugin_ptr__placeholder__page=organization.extended_object,
                cmsplugin_ptr__placeholder__slot="description",
            ):
                description[simple_text.cmsplugin_ptr.language].append(simple_text.body)

            yield {
                "_id": str(organization.extended_object_id),
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
                "description": {l: " ".join(st) for l, st in description.items()},
                "title": titles,
            }

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

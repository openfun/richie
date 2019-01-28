"""
ElasticSearch subject document management utilities
"""
from collections import defaultdict

from django.conf import settings
from django.db.models import Prefetch

from cms.models import Title
from djangocms_picture.models import Picture

from richie.plugins.simple_text_ckeditor.models import SimpleText

from .. import defaults
from ...courses.models import Subject
from ..exceptions import QueryFormatException
from ..forms import SubjectListForm
from ..partial_mappings import MULTILINGUAL_TEXT
from ..utils.i18n import get_best_field_language
from ..utils.indexers import slice_string_for_completion


class SubjectsIndexer:
    """
    Makes available the parameters the indexer requires as well as functions to shape
    objects getting into and out of ElasticSearch
    """

    document_type = "subject"
    index_name = "richie_subjects"
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
    def get_data_for_es(cls, index, action):
        """
        Load all the subjects from the Subject model and format them for the
        ElasticSearch index.
        """
        for subject in (
            Subject.objects.filter(
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
                t.language: t.title for t in subject.extended_object.published_titles
            }

            # Get logo images
            logo_images = {}
            for logo_image in Picture.objects.filter(
                cmsplugin_ptr__placeholder__page=subject.extended_object,
                cmsplugin_ptr__placeholder__slot="logo",
            ):
                # Force the image format before computing it
                logo_image.use_no_cropping = False
                logo_image.width = defaults.SUBJECTS_LOGO_IMAGE_WIDTH
                logo_image.height = defaults.SUBJECTS_LOGO_IMAGE_HEIGHT
                logo_images[logo_image.cmsplugin_ptr.language] = logo_image.img_src

            # Get description texts
            description = defaultdict(list)
            for simple_text in SimpleText.objects.filter(
                cmsplugin_ptr__placeholder__page=subject.extended_object,
                cmsplugin_ptr__placeholder__slot="description",
            ):
                description[simple_text.cmsplugin_ptr.language].append(simple_text.body)

            yield {
                "_id": str(subject.pk),
                "_index": index,
                "_op_type": action,
                "_type": cls.document_type,
                "absolute_url": {
                    language: subject.extended_object.get_absolute_url(language)
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
    def format_es_object_for_api(es_subject, best_language):
        """
        Format an subject stored in ES into a consistent and easy-to-consume record for
        API consumers
        """
        return {
            "id": es_subject["_id"],
            "logo": get_best_field_language(
                es_subject["_source"]["logo"], best_language
            ),
            "title": get_best_field_language(
                es_subject["_source"]["title"], best_language
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
                        "title.fr": {
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

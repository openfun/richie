"""Define SearchConfig as the default app configuration."""

from django.conf import settings

from .elasticsearch import (
    ElasticsearchClientCompat7to6,
    ElasticsearchIndicesClientCompat7to6,
)

# pylint: disable=invalid-name
default_app_config = "richie.apps.search.apps.SearchConfig"

ES_CLIENT = ElasticsearchClientCompat7to6(
    getattr(settings, "RICHIE_ES_HOST", ["elasticsearch"])
)

ES_INDICES_CLIENT = ElasticsearchIndicesClientCompat7to6(ES_CLIENT)

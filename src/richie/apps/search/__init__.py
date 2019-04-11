"""Define SearchConfig as the default app configuration."""
from django.conf import settings

from elasticsearch import Elasticsearch

# pylint: disable=invalid-name
default_app_config = "richie.apps.search.apps.SearchConfig"

ES_CLIENT = Elasticsearch([getattr(settings, "RICHIE_ES_HOST", "elasticsearch")])

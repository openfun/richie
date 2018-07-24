"""
Import custom settings and set up defaults for values the Search app needs
"""
from django.conf import settings

# Define our aggregations names, for our ES query, which will match with the field
# names on the objects & the facets we return on the API response
RESOURCE_FACETS = getattr(
    settings, "RICHIE_SEARCH_RESOURCE_FACETS", ["organizations", "subjects"]
)

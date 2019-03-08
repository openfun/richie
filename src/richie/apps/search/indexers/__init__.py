"""Elasticsearch indices for Richie's search app."""
from django.conf import settings

from ..utils.indexers import IndicesList

ES_INDICES = IndicesList(
    **getattr(
        settings,
        "ES_INDICES",
        {
            "courses": "richie.apps.search.indexers.courses.CoursesIndexer",
            "organizations": "richie.apps.search.indexers.organizations.OrganizationsIndexer",
            "categories": "richie.apps.search.indexers.categories.CategoriesIndexer",
        },
    )
)

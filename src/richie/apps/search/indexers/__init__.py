"""Elasticsearch indices for Richie's search app."""

from django.conf import settings

from ..utils.indexers import IndicesList

ES_INDICES = IndicesList(
    **getattr(
        settings,
        "ES_INDICES",
        {
            "categories": "richie.apps.search.indexers.categories.CategoriesIndexer",
            "courses": "richie.apps.search.indexers.courses.CoursesIndexer",
            "licences": "richie.apps.search.indexers.licences.LicencesIndexer",
            "organizations": "richie.apps.search.indexers.organizations.OrganizationsIndexer",
            "persons": "richie.apps.search.indexers.persons.PersonsIndexer",
        },
    )
)

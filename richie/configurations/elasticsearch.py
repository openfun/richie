"""
ElasticSearch settings mixin
"""

from configurations import values
from elasticsearch import Elasticsearch


class ElasticSearchMixin(object):
    """
    Elastic Search configuration mixin

    You may want to override default configuration by setting the following environment
    variable:

    * ES_CLIENT
    """

    ES_CLIENT = Elasticsearch(
        [values.Value("localhost", environ_name="ES_CLIENT", environ_prefix=None)]
    )
    ES_CHUNK_SIZE = 500
    ES_INDEXES = [
        "apps.search.indexers.courses.CoursesIndexer",
        "apps.search.indexers.organizations.OrganizationsIndexer",
        "apps.search.indexers.subjects.SubjectsIndexer",
    ]

    ES_DEFAULT_PAGE_SIZE = 10

    COURSE_API_ENDPOINT = "https://www.fun-mooc.fr/fun/api/courses"
    ORGANIZATION_API_ENDPOINT = "https://www.fun-mooc.fr/fun/api/universities"
    SUBJECT_API_ENDPOINT = "https://www.fun-mooc.fr/fun/api/course_subjects"

"""
Indexing utility for the ElasticSearch-related regenerate_index command
"""
from django.conf import settings

from ...organizations.models import OrganizationPage


class OrganizationIndexer():
    """
    Makes available the parameters the indexer requires as well as a function to shape
    objects into what we want to index in ElasticSearch
    """
    document_type = 'organization'
    index_name = 'fun_cms_organizations'
    mapping = {
        'properties': {
            'code': {'type': 'keyword'},
            'name': {
                'properties': {
                    lang: {'type': 'text'} for lang, name in settings.LANGUAGES
                },
            },
        },
    }

    def get_data_for_es(self, index, action):
        """
        Load all the organizations and format them for the ElasticSearch index
        """
        for organization in OrganizationPage.objects.all().prefetch_related('name'):
            yield {
                '_id': organization.id,
                '_index': index,
                '_op_type': action,
                '_type': self.document_type,
                'code': organization.code,
                'name': {
                    lang: organization.safe_translation_getter(
                        'name',
                        language_code=lang,
                    ) for lang, name in settings.LANGUAGES
                },
            }

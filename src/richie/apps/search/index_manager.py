"""
ElasticSearch indices utilities.
"""
from functools import reduce

from django.conf import settings
from django.utils import timezone

from elasticsearch.client import IndicesClient
from elasticsearch.exceptions import NotFoundError, RequestError
from elasticsearch.helpers import bulk

from . import ES_CLIENT
from .defaults import ES_CHUNK_SIZE, ES_INDICES_PREFIX
from .indexers import ES_INDICES
from .text_indexing import ANALYSIS_SETTINGS


def richie_bulk(actions):
    """Wrap bulk helper to set default parameters."""
    return bulk(
        actions=actions,
        chunk_size=getattr(settings, "RICHIE_ES_CHUNK_SIZE", ES_CHUNK_SIZE),
        client=ES_CLIENT,
        stats_only=True,
    )


def get_indices_by_alias(existing_indices, alias):
    """
    Get existing index(es) for an alias. Support multiple existing aliases so the command
    always 'cleans up' the aliases even if they got messed up somehow.
    """
    for index, details in existing_indices.items():
        if alias in details.get("aliases", {}):
            yield index, alias


def perform_create_index(indexable, logger=None):
    """
    Create a new index in ElasticSearch from an indexable instance
    """
    indices_client = IndicesClient(client=ES_CLIENT)
    # Create a new index name, suffixing its name with a timestamp
    new_index = f"{indexable.index_name:s}_{timezone.now():%Y-%m-%d-%Hh%Mm%S.%fs}"

    # Create the new index
    if logger:
        logger.info(f'Creating a new Elasticsearch index "{new_index:s}"...')
    indices_client.create(index=new_index)

    # The index needs to be closed before we set an analyzer
    indices_client.close(index=new_index)
    indices_client.put_settings(body=ANALYSIS_SETTINGS, index=new_index)
    indices_client.open(index=new_index)

    indices_client.put_mapping(
        body=indexable.mapping, doc_type=indexable.document_type, index=new_index
    )

    # Populate the new index with data provided from our indexable class
    richie_bulk(indexable.get_es_documents(new_index))

    # Return the name of the index we just created in ElasticSearch
    return new_index


def regenerate_indices(logger):
    """
    Create new indices for our indexables and replace possible existing indices with
    a new one only once it has successfully built it.
    """
    # Prepare the client we'll be using to handle indices
    indices_client = IndicesClient(client=ES_CLIENT)

    # Get all existing indices once; we'll look up into this list many times
    try:
        existing_indices = indices_client.get_alias("*")
    except NotFoundError:
        # Provide a fallback empty list so we don't have to check for its existence later on
        existing_indices = []

    # Create a new index for each of those modules
    # NB: we're mapping perform_create_index which produces side-effects
    indices_to_create = zip(
        list(map(lambda ix: perform_create_index(ix, logger), ES_INDICES)), ES_INDICES
    )

    # Prepare to alias them so they can be swapped-in for the previous versions
    actions_to_create_aliases = [
        {"add": {"index": index, "alias": ix.index_name}}
        for index, ix in indices_to_create
    ]

    # Get the previous indices for every alias
    indices_to_unalias = reduce(
        lambda acc, ix: acc
        + list(get_indices_by_alias(existing_indices, ix.index_name)),
        ES_INDICES,
        [],
    )

    # Prepare to un-alias them so they can be swapped-out for the new versions
    # NB: use chain to flatten the list of generators
    actions_to_delete_aliases = [
        {"remove": {"index": index, "alias": alias}}
        for index, alias in indices_to_unalias
    ]

    # Identify orphaned indices that belong to our own app.
    # NB: we *must* do this before the update_aliases call so we don't immediately prune
    # version n-1 of all our indices
    useless_indices = [
        index
        for index, details in existing_indices.items()
        if index.startswith(str(ES_INDICES_PREFIX)) and not details["aliases"]
    ]

    # Replace the old indices with the new ones in 1 atomic operation to avoid outage
    def perform_aliases_update():
        try:
            indices_client.update_aliases(
                dict(actions=actions_to_create_aliases + actions_to_delete_aliases)
            )
        except RequestError as exception:
            # This operation can fail if an index exists with the same name as an alias we're
            # attempting to create. In Richie, this is not supposed to happen and is usually the
            # result of a broken ES state.
            if exception.error == "invalid_alias_name_exception":
                # Identify the broken index
                broken_index = exception.info["error"]["index"]
                # Delete it (it was unusable and we can recreate its data at-will)
                indices_client.delete(index=broken_index)
                # Attempt to perform the operation again
                # We're doing this recursively in case more than one such broken indices existed
                # (eg. "richie_courses" and "richie_organizations")
                perform_aliases_update()
            # Let other kinds of errors be raised
            else:
                raise exception

    perform_aliases_update()

    for useless_index in useless_indices:
        # Disable keyword arguments checking as elasticsearch-py uses a decorator to list
        # valid query parameters and inject them as kwargs. I won't say a word about this
        # anti-pattern.
        #
        # pylint: disable=unexpected-keyword-arg
        indices_client.delete(index=useless_index, ignore=[400, 404])


def store_es_scripts(logger=None):
    """
    Iterate over the indexers listed in the settings, import them, and store the scripts
    they define on their "scripts" key in ElasticSearch
    """
    for indexer in ES_INDICES:
        for script_id, script_body in indexer.scripts.items():
            if logger:
                logger.info(f'Storing script "{script_id:s}"...')
            ES_CLIENT.put_script(id=script_id, body=script_body)

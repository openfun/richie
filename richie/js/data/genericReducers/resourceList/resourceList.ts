import get from 'lodash-es/get';

import { APIResponseListFacets } from '../../../types/api';
import Resource from '../../../types/Resource';
import { ResourceListGetSuccess } from '../../genericSideEffects/getResourceList/actions';

export const initialState = {};

export interface ResourceListState<R extends Resource> {
  currentQuery?: {
    facets: APIResponseListFacets;
    // A number-keyed object is more stable than an array to keep a list with a moving starting
    // index and potential gaps throughout.
    // NB: we still use string as the index type as keys of an objects are always converted to strings
    items: { [index: string]: R['id'] };
    queryKey: string;
    total_count: number;
  };
}

export function currentQuery<R extends Resource>(
  state: ResourceListState<R>,
  action: ResourceListGetSuccess<R> | { type: '' },
): ResourceListState<Resource> {
  // Initialize the state to an empty version of itself
  if (!state) { state = initialState; }
  if (!action) { return state; } // Compiler needs help

  switch (action.type) {
    // Create or update the latest resource list we fetched from the server
    case 'RESOURCE_LIST_GET_SUCCESS':
      const { facets = {}, objects, meta } = action.apiResponse;
      // Generate a generic representation of our query as a string with pagination params removed
      const { limit, offset = 0, ...cleanQuery } = action.params;
      const queryKey = JSON.stringify(cleanQuery);

      return {
        ...state,
        currentQuery: {
          facets,
          items: objects.reduce(
            // Transform the array into an object with indexes as keys
            (acc, item, index) => ({ ...acc, [offset + index]: item.id }), {},
          ),
          queryKey,
          total_count: meta.total_count,
        },
      };
  }
  return state;
}

export default currentQuery;

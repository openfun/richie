import get from 'lodash-es/get';

import { Settings } from '../../../settings';
import settings from '../../../settings.json';
import {
  APIListCommonRequestParams,
  APIResponseListFacets,
} from '../../../types/api';
import { Resource } from '../../../types/Resource';
import { Maybe } from '../../../utils/types';
import {
  ResourceListGet,
  ResourceListGetSuccess,
} from '../../genericSideEffects/getResourceList/actions';

const { API_LIST_DEFAULT_PARAMS } = settings as Settings;

export const initialState = {};

export type ResourceListStateParams = APIListCommonRequestParams & {
  [key: string]: Maybe<string | number | Array<string | number>>;
};

export interface ResourceListState<R extends Resource> {
  currentQuery?: {
    facets: APIResponseListFacets;
    // A number-keyed object is more stable than an array to keep a list with a moving starting
    // index and potential gaps throughout.
    // NB: we still use string as the index type as keys of an objects are always converted to strings
    items: { [index: string]: R['id'] };
    params: ResourceListStateParams;
    total_count: number;
  };
}

export function currentQuery<R extends Resource>(
  state: ResourceListState<R>,
  action: ResourceListGetSuccess<R> | { type: '' },
): ResourceListState<Resource> {
  // Initialize the state to an empty version of itself
  if (!state) {
    state = initialState;
  }
  if (!action) {
    return state;
  } // Compiler needs help

  switch (action.type) {
    // Create or update the latest resource list we fetched from the server
    case 'RESOURCE_LIST_GET_SUCCESS':
      const { facets = {}, objects, meta } = action.apiResponse;
      // Get the limit/offset from our params, set our defaults
      // tslint:disable:trailing-comma // Prettier does not format this syntax properly
      const {
        limit = API_LIST_DEFAULT_PARAMS.limit,
        offset = API_LIST_DEFAULT_PARAMS.offset,
        ...restParams
      } = action.params;

      return {
        ...state,
        currentQuery: {
          facets,
          items: objects.reduce(
            // Transform the array into an object with indexes as keys
            (acc, item, index) => ({ ...acc, [offset + index]: item.id }),
            {},
          ),
          // Copy back the params, now with proper defaults on limit/offset
          params: { ...restParams, limit, offset },
          total_count: meta.total_count,
        },
      };
  }
  return state;
}

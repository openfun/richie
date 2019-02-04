import { stringify } from 'query-string';
import { call, put, takeEvery } from 'redux-saga/effects';

import { API_ENDPOINTS, API_LIST_DEFAULT_PARAMS } from '../../../settings';
import { APIResponseListFacets, APIResponseListMeta } from '../../../types/api';
import { Resource } from '../../../types/Resource';
import { addMultipleResources } from '../../genericReducers/resourceById/actions';
import { RootState } from '../../rootReducer';
import {
  didGetResourceList,
  failedToGetResourceList,
  ResourceListGet,
} from './actions';

// Use a polymorphic response object so it can be elegantly consumed through destructuration
export interface Response {
  error?: string;
  facets?: APIResponseListFacets;
  meta?: APIResponseListMeta;
  objects?: Resource[];
}

export interface GetListSagaSpecifics {
  endpoint: string;
}

// Wrap fetch to handle params, headers, parsing & sane response handling
// NB: some of this logic should be move in a separate module when we reuse it elsewhere
export async function fetchList(
  resourceName: keyof RootState['resources'],
  params: ResourceListGet['params'] = API_LIST_DEFAULT_PARAMS,
): Promise<Response> {
  const endpoint = API_ENDPOINTS.search[resourceName];

  try {
    const response = await fetch(`${endpoint}?${stringify(params)}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      // Push remote errors to the error channel for consistency
      throw new Error(
        `Failed to get list from ${endpoint} : ${response.status}.`,
      );
    }

    return await response.json();
  } catch (error) {
    return { error };
  }
}

export function* getList(action: ResourceListGet) {
  const { params, resourceName } = action;
  const { error, meta, objects, ...restProps }: Response = yield call(
    fetchList,
    resourceName,
    params,
  );

  if (error) {
    yield put(failedToGetResourceList(resourceName, error));
  } else {
    // Add each individual resource to the state before we put the success action in
    // order to avoid race conditions / incomplete data sets
    yield put(addMultipleResources(resourceName, objects!));
    yield put(
      didGetResourceList(
        resourceName,
        { meta: meta!, objects: objects!, ...restProps },
        params!,
      ),
    );
  }
}

export function* getResourceListSaga() {
  // We can cancel ongoing requests whenever there's a new one: the user will not request several different sets
  // of filters of the same kind at the same time.
  yield takeEvery('RESOURCE_LIST_GET', getList);
}

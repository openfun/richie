import partial from 'lodash-es/partial';
import { call, put, takeEvery } from 'redux-saga/effects';

import { API_ENDPOINTS } from '../../../settings.json';
import { APIResponseListMeta } from '../../../types/api';
import Resource from '../../../types/Resource';
import formatQueryString from '../../../utils/http/formatQueryString';
import { addResource } from '../../genericReducers/resourceById/actions';
import { RootState } from '../../rootReducer';
import {
  didGetResourceList,
  failedToGetResourceList,
  ResourceListGet,
  ResourceListGetFailure,
  ResourceListGetSuccess,
} from './actions';

// Use a polymorphic response object so it can be elegantly consumed through destructuration
export interface Response {
  error?: string;
  meta?: {
    limit: number;
    offset: number;
    total_count: number;
  };
  objects?: Resource[];
}

export interface GetListSagaSpecifics {
  endpoint: string;
}

// Wrap fetch to handle params, headers, parsing & sane response handling
// NB: some of this logic should be move in a separate module when we reuse it elsewhere
export function fetchList(
  resourceName: keyof RootState['resources'],
  params?: ResourceListGet['params'],
): Promise<Response> {
  const endpoint = API_ENDPOINTS[resourceName];

  return fetch(endpoint + formatQueryString(params), {
    headers: {
      'Content-Type': 'application/json',
    },
  })
  .then((response) => {
    // Fetch treats remote errors (400, 404, 503...) as successes. The ok flag is the way to discriminate.
    if (response.ok) {
      return response;
    }
    // Push remote errors to the error channel for consistency
    throw new Error('Failed to get list from ' + endpoint + ' : ' + response.status);
  })
  .then((response) => response.json())
  .catch((error) => ({ error }));
}

export function* getList(action: ResourceListGet) {
  const { params, resourceName } = action;
  const { error, meta, objects, ...restProps }: Response = yield call(fetchList, resourceName, params);

  if (error) {
    yield put(failedToGetResourceList(resourceName, error));
  } else {
    // Add each individual resource to the state before we put the success action in
    // order to avoid race conditions / incomplete data sets
    for (const resource of objects) {
      yield put(addResource(resourceName, resource));
    }
    yield put(didGetResourceList(resourceName, { meta, objects, ...restProps }, params));
  }
}

export default function* watch() {
  // We can cancel ongoing requests whenever there's a new one: the user will not request several different sets
  // of filters of the same kind at the same time.
  yield takeEvery('RESOURCE_LIST_GET', getList);
}

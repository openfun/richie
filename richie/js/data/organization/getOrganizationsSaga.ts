import { call, put, takeLatest } from 'redux-saga/effects';

import Organization from '../../types/Organization';
import formatQueryString from '../../utils/http/formatQueryString';
import { addOrganization, didGetOrganizations, failedToGetOrganizations, OrganizationsGet } from './actions';

// Use a polymorphic response object so it can be elegantly consumed through destructuration
interface Response {
  error?: string | Error;
  organizations?: Organization[];
}

// Wrap fetch to handle params, headers, parsing & sane response handling
// NB: some of this logic should be move in a separate module when we reuse it elsewhere
export function fetchOrganizations(params?: OrganizationsGet['params']): Promise<Response> {
  return fetch('/organizations' + formatQueryString(params), {
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
    throw new Error('Failed to get the organizations: ' + response.status);
  })
  .then((response) => response.json())
  .then((response: { results: Organization[] }) => ({ organizations: response.results }))
  .catch((error) => ({ error }));
}

export function* getOrganizations(action: OrganizationsGet) {
  const { params } = action;
  const { error, organizations }: Response = yield call(fetchOrganizations, params);

  if (error) {
    yield put(failedToGetOrganizations(error));
  } else {
    // Add each individual organization to the state before we put the success action in
    // order to avoid race conditions / incomplete data sets
    for (const organization of organizations) {
      yield put(addOrganization(organization));
    }
    yield put(didGetOrganizations(organizations, params));
  }
}

export default function* watch() {
  // We can cancel ongoing requests whenever there's a new one: the user will not request several different sets
  // of filters of the same kind at the same time.
  yield takeLatest('ORGANIZATION_LIST_GET', getOrganizations);
}

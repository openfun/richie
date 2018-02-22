import { all } from 'redux-saga/effects';

import getOrganizationsSaga from './organization/getOrganizationsSaga';

// Aggregate all our sagas through the parallelization effect
export default function* rootSaga() {
  yield all([
    getOrganizationsSaga(),
  ]);
}

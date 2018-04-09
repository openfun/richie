import { all } from 'redux-saga/effects';

import getCourseListSaga from './course/sideEffects/getList';
import getOrganizationsSaga from './organization/getOrganizationsSaga';

// Aggregate all our sagas through the parallelization effect
export default function* rootSaga() {
  yield all([
    getCourseListSaga(),
    getOrganizationsSaga(),
  ]);
}

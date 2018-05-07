import { all } from 'redux-saga/effects';

import getResourceListSaga from './genericSideEffects/getResourceList/getResourceList';

// Aggregate all our sagas through the parallelization effect
export default function* rootSaga() {
  yield all([getResourceListSaga()]);
}

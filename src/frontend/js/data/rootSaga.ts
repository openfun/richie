import { all } from 'redux-saga/effects';

import { getResourceListSaga } from './genericSideEffects/getResourceList/getResourceList';
import { pushHistoryState } from './genericSideEffects/pushHistoryState/pushHistoryState';

// Aggregate all our sagas through the parallelization effect
export function* rootSaga() {
  yield all([getResourceListSaga(), pushHistoryState()]);
}

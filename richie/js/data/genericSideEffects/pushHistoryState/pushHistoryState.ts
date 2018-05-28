import partial from 'lodash-es/partial';
import { takeEvery } from 'redux-saga/effects';

import { HistoryPushState } from './actions';

export function pushState(w: Window, action: HistoryPushState) {
  w.history.pushState(action.state, action.title, action.url);
}

export function* pushHistoryState() {
  yield takeEvery('HISTORY_PUSH_STATE', partial(pushState, window));
}

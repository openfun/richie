import { createStore, applyMiddleware } from 'redux';
import createSagaMiddleware from 'redux-saga';

import { rootReducer, rootState } from './rootReducer';

const sagaMiddleware = createSagaMiddleware();

export default function configureStore (preloadedState: rootState = {}) {
  return createStore(
    rootReducer,
    preloadedState,
    applyMiddleware(
      sagaMiddleware,
    ),
  );
}

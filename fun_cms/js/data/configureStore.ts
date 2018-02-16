import { applyMiddleware, createStore } from 'redux';
import createSagaMiddleware from 'redux-saga';

import { rootReducer, RootState } from './rootReducer';

const sagaMiddleware = createSagaMiddleware();

export default function configureStore(preloadedState: RootState = {}) {
  return createStore(
    rootReducer,
    preloadedState,
    applyMiddleware(
      sagaMiddleware,
    ),
  );
}

import { applyMiddleware, createStore } from 'redux';
import createSagaMiddleware from 'redux-saga';

import { rootReducer, RootState } from './rootReducer';
import rootSaga from './rootSaga';

const sagaMiddleware = createSagaMiddleware();

export default function configureStore(preloadedState: RootState = {}) {
  const store = createStore(
    rootReducer,
    preloadedState,
    applyMiddleware(
      sagaMiddleware,
    ),
  );

  sagaMiddleware.run(rootSaga);

  return store;
}

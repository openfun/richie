import { applyMiddleware, compose, createStore } from 'redux';
import createSagaMiddleware from 'redux-saga';

import { CONFIG } from '../settings';
import { rootReducer, RootState } from './rootReducer';
import { rootSaga } from './rootSaga';

const sagaMiddleware = createSagaMiddleware();

export function configureStore(preloadedState: RootState) {
  const reduxDevtoolsCompose = (window as any)
    .__REDUX_DEVTOOLS_EXTENSION_COMPOSE__;

  const composeEnhancers =
    CONFIG.enableDevTools && reduxDevtoolsCompose
      ? reduxDevtoolsCompose
      : compose;

  const store = createStore(
    rootReducer,
    preloadedState,
    composeEnhancers(applyMiddleware(sagaMiddleware)),
  );

  sagaMiddleware.run(rootSaga);

  return store;
}

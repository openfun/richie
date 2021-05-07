/**
 * Largely inspired by the createLocalStoragePersistor-experimental module
 * included within react-query
 *
 * Just use sessionStorage instead of localStorage
 */

import { PersistedClient, Persistor } from 'react-query/persistQueryClient-experimental';
import { throttle } from 'lodash-es';
import { noop } from 'utils';
import { REACT_QUERY_SETTINGS } from 'settings';

interface CreateSessionStoragePersistorOptions {
  localStorageKey?: string;
  throttleTime?: number;
}

export function createSessionStoragePersistor({
  localStorageKey = REACT_QUERY_SETTINGS.cacheStorage.key,
  throttleTime = REACT_QUERY_SETTINGS.cacheStorage.throttleTime,
}: CreateSessionStoragePersistorOptions = {}): Persistor {
  if (typeof sessionStorage !== 'undefined') {
    return {
      persistClient: throttle((persistedClient) => {
        sessionStorage.setItem(localStorageKey, JSON.stringify(persistedClient));
      }, throttleTime),
      restoreClient: () => {
        const cacheString = sessionStorage.getItem(localStorageKey);

        if (!cacheString) {
          return;
        }

        return JSON.parse(cacheString) as PersistedClient;
      },
      removeClient: () => {
        sessionStorage.removeItem(localStorageKey);
      },
    };
  }

  return {
    persistClient: noop,
    restoreClient: noop,
    removeClient: noop,
  };
}

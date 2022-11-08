import { QueryClient, QueryClientConfig } from '@tanstack/react-query';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { handle } from 'utils/errors/handle';
import { REACT_QUERY_SETTINGS } from 'settings';
import { noop } from 'utils';
import context from 'utils/context';

export interface QueryClientOptions {
  logger?: boolean;
  persister?: boolean;
}

const createQueryClient = (options?: QueryClientOptions) => {
  const environment = context?.environment;

  const configuration: QueryClientConfig = {
    defaultOptions: {
      queries: {
        cacheTime: REACT_QUERY_SETTINGS.cacheTime,
        refetchOnWindowFocus: false,
        retry: false,
        staleTime: REACT_QUERY_SETTINGS.staleTimes.default,
      },
    },
    logger: {
      log: noop,
      warn: noop,
      error: noop,
    },
  };

  if (options?.logger) {
    // Link react-query logger to our error handler
    configuration.logger = {
      // eslint-disable-next-line no-console
      log: environment === 'development' ? console.log : noop,
      warn: environment === 'development' ? console.warn : noop,
      error: handle,
    };
  }

  const queryClient = new QueryClient(configuration);

  if (options?.persister) {
    // Prepare react-query cache persistance
    const persister = createSyncStoragePersister({
      storage: sessionStorage,
      key: REACT_QUERY_SETTINGS.cacheStorage.key,
      throttleTime: REACT_QUERY_SETTINGS.cacheStorage.throttleTime,
    });
    persistQueryClient({
      persister,
      queryClient,
    });
  }

  return queryClient;
};

export default createQueryClient;

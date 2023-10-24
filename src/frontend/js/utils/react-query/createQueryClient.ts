import { QueryClient, QueryClientConfig } from '@tanstack/react-query';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { QueryCache } from '@tanstack/query-core';
import { REACT_QUERY_SETTINGS } from 'settings';
import { handle } from 'utils/errors/handle';
import { HttpError } from 'utils/errors/HttpError';

export interface QueryClientOptions {
  logger?: boolean;
  persister?: boolean;
}

const createQueryClient = (options?: QueryClientOptions) => {
  const configuration: QueryClientConfig = {
    queryCache: new QueryCache({
      onError: (error) => {
        // Only trigger error handler for server errors
        if (error instanceof HttpError && error.code >= 500) {
          handle(error);
        }
      },
    }),
    defaultOptions: {
      queries: {
        gcTime: REACT_QUERY_SETTINGS.gcTime,
        refetchOnWindowFocus: false,
        retry: false,
        staleTime: REACT_QUERY_SETTINGS.staleTimes.default,
      },
    },
  };

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

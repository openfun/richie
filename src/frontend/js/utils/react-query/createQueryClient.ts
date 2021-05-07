import { createSessionStoragePersistor } from 'utils/react-query/createSessionStoragePersistor';
import { persistQueryClient } from 'react-query/persistQueryClient-experimental';
import { QueryClient, setLogger } from 'react-query';
import { CommonDataProps } from 'types/commonDataProps';
import { handle } from 'utils/errors/handle';
import { REACT_QUERY_SETTINGS } from 'settings';
import { noop } from 'utils';

interface QueryClientOptions {
  logger?: boolean;
  persistor?: boolean;
}

const createQueryClient = (options?: QueryClientOptions) => {
  const context: CommonDataProps['context'] = (window as any)?.__richie_frontend_context__?.context;
  const environment = context?.environment;

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        cacheTime: REACT_QUERY_SETTINGS.cacheTime,
        refetchOnWindowFocus: false,
        retry: false,
        staleTime: REACT_QUERY_SETTINGS.staleTimes.default,
      },
    },
  });

  if (options?.logger) {
    // Link react-query logger to our error handler
    setLogger({
      // eslint-disable-next-line no-console
      log: environment === 'development' ? console.log : noop,
      warn: environment === 'development' ? console.warn : noop,
      error: handle,
    });
  }

  if (options?.persistor) {
    // Prepare react-query cache persistance
    const localStoragePersistor = createSessionStoragePersistor();
    persistQueryClient({
      persistor: localStoragePersistor,
      queryClient,
    });
  }

  return queryClient;
};

export default createQueryClient;

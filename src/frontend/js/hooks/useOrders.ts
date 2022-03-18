import { useQueryClient } from 'react-query';
import { useJoanieApi } from 'data/JoanieApiProvider';
import { REACT_QUERY_SETTINGS } from 'settings';
import useLocalizedQueryKey from 'utils/react-query/useLocalizedQueryKey';
import { useSessionMutation } from 'utils/react-query/useSessionMutation';
import { useSessionQuery } from 'utils/react-query/useSessionQuery';

/**
 * Joanie Api hook to retrieve/create/abort an order owned by the authenticated user.
 */
export const useOrders = () => {
  const API = useJoanieApi();
  const baseQueryKey = useLocalizedQueryKey('orders');
  const queryClient = useQueryClient();

  const [readHandler, queryKey] = useSessionQuery(baseQueryKey, () => API.user.orders.get());

  const prefetch = async () => {
    await queryClient.prefetchQuery(queryKey, () => API.user.orders.get(), {
      staleTime: REACT_QUERY_SETTINGS.staleTimes.sessionItems,
    });
  };

  const invalidate = async () => {
    // Invalidate all order's queries no matter the locale
    const unlocalizedQueryKey = queryKey.slice(0, -1);
    await queryClient.invalidateQueries(unlocalizedQueryKey);
  };

  const creationHandler = useSessionMutation(API.user.orders.create, {
    onSuccess: invalidate,
  });

  const abortHandler = useSessionMutation(API.user.orders.abort);

  return {
    items: readHandler.data?.results,
    methods: {
      abort: abortHandler.mutateAsync,
      create: creationHandler.mutateAsync,
      invalidate,
      prefetch,
      refetch: readHandler.refetch,
    },
    states: {
      fetching: readHandler.isLoading,
      creating: creationHandler.isLoading,
      aborting: abortHandler.isLoading,
    },
  };
};

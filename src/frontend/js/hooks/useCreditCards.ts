import { useQueryClient } from 'react-query';
import { REACT_QUERY_SETTINGS } from 'settings';
import { useJoanieApi } from 'data/JoanieApiProvider';
import { useSessionQuery } from 'utils/react-query/useSessionQuery';
import { useSessionMutation } from 'utils/react-query/useSessionMutation';

/**
 * Joanie Api hook to retrieve/create/update/delete credit cards
 * owned by the authenticated user.
 *
 */
export const useCreditCards = () => {
  const API = useJoanieApi();
  const queryClient = useQueryClient();

  const [readHandler, queryKey] = useSessionQuery('credit-cards', () => API.user.creditCards.get());

  const prefetch = async () => {
    await queryClient.prefetchQuery(queryKey, () => API.user.creditCards.get(), {
      staleTime: REACT_QUERY_SETTINGS.staleTimes.sessionItems,
    });
  };

  const invalidate = async () => {
    await queryClient.invalidateQueries(queryKey);
  };

  const writeHandlers = {
    create: useSessionMutation(API.user.creditCards.create, {
      onSuccess: invalidate,
    }),
    update: useSessionMutation(API.user.creditCards.update, {
      onSuccess: invalidate,
    }),
    delete: useSessionMutation(API.user.creditCards.delete, {
      onSuccess: invalidate,
    }),
  };

  return {
    items: readHandler.data || [],
    methods: {
      invalidate,
      prefetch,
      refetch: readHandler.refetch,
      create: writeHandlers.create.mutate,
      update: writeHandlers.update.mutate,
      delete: writeHandlers.delete.mutate,
    },
    states: {
      fetching: readHandler.isLoading,
      creating: writeHandlers.create.isLoading,
      deleting: writeHandlers.delete.isLoading,
      updating: writeHandlers.update.isLoading,
    },
  };
};

import { useQueryClient } from 'react-query';
import { useJoanieApi } from 'data/JoanieApiProvider';
import { REACT_QUERY_SETTINGS } from 'settings';
import { useSessionQuery } from 'utils/react-query/useSessionQuery';
import { useSessionMutation } from 'utils/react-query/useSessionMutation';

/**
 * Joanie Api hook to retrieve/create/update/delete addresses
 * owned by the authenticated user.
 */
export const useAddresses = () => {
  const API = useJoanieApi();
  const queryClient = useQueryClient();

  const [readHandler, queryKey] = useSessionQuery('addresses', () => API.user.addresses.get());

  const prefetch = async () => {
    await queryClient.prefetchQuery(queryKey, () => API.user.addresses.get(), {
      staleTime: REACT_QUERY_SETTINGS.staleTimes.sessionItems,
    });
  };

  const invalidate = async () => {
    await queryClient.invalidateQueries(queryKey);
  };

  const writeHandlers = {
    create: useSessionMutation(API.user.addresses.create, {
      onSuccess: invalidate,
    }),
    update: useSessionMutation(API.user.addresses.update, {
      onSuccess: invalidate,
    }),
    delete: useSessionMutation(API.user.addresses.delete, {
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

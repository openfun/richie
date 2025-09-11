import { useIntl, defineMessages } from 'react-intl';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useJoanieApi } from 'contexts/JoanieApiContext';
import { useSessionMutation } from 'utils/react-query/useSessionMutation';
import { ResourcesQuery } from 'hooks/useResources';

const messages = defineMessages({
  errorCreate: {
    id: 'hooks.useBatchOrders.errorCreate',
    defaultMessage: 'An error occurred while creating the batch order.',
    description: 'Error message shown when batch order creation fails.',
  },
});

export const useBatchOrder = () => {
  const api = useJoanieApi();
  const intl = useIntl();
  const queryClient = useQueryClient();

  const createHandler = useSessionMutation({
    mutationFn: api.user.batchOrders.create,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['batchOrders'] });
    },
    onError: () => {
      throw new Error(intl.formatMessage(messages.errorCreate));
    },
  });

  const get = (id?: string) =>
    id
      ? useQuery({
          queryKey: ['batchOrders', id],
          queryFn: () => api.user.batchOrders.get(id),
        })
      : useQuery({
          queryKey: ['batchOrders'],
          queryFn: () => api.user.batchOrders.get(),
        });

  return {
    methods: {
      create: createHandler.mutateAsync,
      get,
    },
    states: {
      isPending: createHandler.isPending,
    },
  };
};

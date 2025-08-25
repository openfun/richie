import { useIntl, defineMessages } from 'react-intl';
import { useQueryClient } from '@tanstack/react-query';
import { useJoanieApi } from 'contexts/JoanieApiContext';
import { useSessionMutation } from 'utils/react-query/useSessionMutation';

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

  return {
    methods: {
      create: createHandler.mutateAsync,
    },
    states: {
      isPending: createHandler.isPending,
    },
  };
};

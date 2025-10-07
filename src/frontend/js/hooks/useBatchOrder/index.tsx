import { defineMessages } from 'react-intl';
import { useJoanieApi } from 'contexts/JoanieApiContext';
import { ResourcesQuery, useResource, useResources, UseResourcesProps } from 'hooks/useResources';
import { API, BatchOrderQueryFilters, BatchOrderRead } from 'types/Joanie';

const messages = defineMessages({
  errorCreate: {
    id: 'hooks.useBatchOrders.errorCreate',
    defaultMessage: 'An error occurred while creating the batch order.',
    description: 'Error message shown when batch order creation fails.',
  },
});

const props: UseResourcesProps<BatchOrderRead, BatchOrderQueryFilters, API['user']['batchOrders']> =
  {
    queryKey: ['batchOrders'],
    apiInterface: () => useJoanieApi().user.batchOrders,
    session: true,
    messages,
  };

export const useBatchOrders = useResources<BatchOrderRead, BatchOrderQueryFilters>(props);
export const useBatchOrder = useResource<BatchOrderRead, BatchOrderQueryFilters>(props);

export const useBatchOrdersActions = () => {
  const { user } = useJoanieApi();
  const api = user.batchOrders;

  const submitForPayment = async (filters: ResourcesQuery) => {
    return api.submit_for_payment.create(filters);
  };

  return {
    submitForPayment,
  };
};

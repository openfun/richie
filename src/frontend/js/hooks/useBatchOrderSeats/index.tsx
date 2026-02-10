import { defineMessages } from 'react-intl';
import { useJoanieApi } from 'contexts/JoanieApiContext';
import { useResources, UseResourcesProps } from 'hooks/useResources';
import { API, BatchOrderSeat, BatchOrderSeatsQueryFilters } from 'types/Joanie';

const messages = defineMessages({
  errorGet: {
    id: 'hooks.useBatchOrderSeats.errorGet',
    description: 'Error message shown to the user when batch order seats fetch request fails.',
    defaultMessage: 'An error occurred while fetching batch order seats. Please retry later.',
  },
  errorNotFound: {
    id: 'hooks.useBatchOrderSeats.errorNotFound',
    description: 'Error message shown to the user when no batch order seats matches.',
    defaultMessage: 'Cannot find the batch order seats.',
  },
});

const props: UseResourcesProps<
  BatchOrderSeat,
  BatchOrderSeatsQueryFilters,
  API['user']['batchOrders']['seats']
> = {
  queryKey: ['batch_order_seats'],
  apiInterface: () => useJoanieApi().user.batchOrders.seats,
  messages,
  session: true,
};

export const useBatchOrderSeats = useResources<BatchOrderSeat, BatchOrderSeatsQueryFilters>(props);

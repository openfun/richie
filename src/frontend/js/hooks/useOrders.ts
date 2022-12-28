import { useJoanieApi } from 'data/JoanieApiProvider';
import { useSessionMutation } from 'utils/react-query/useSessionMutation';
import { API, Order } from '../types/Joanie';
import {
  QueryOptions,
  ResourcesQuery,
  useResource,
  useResourcesCustom,
  UseResourcesProps,
} from './useResources';

const props: UseResourcesProps<Order, ResourcesQuery, API['user']['orders']> = {
  queryKey: ['orders'],
  apiInterface: () => useJoanieApi().user.orders,
  omniscient: true,
  session: true,
};
export const useOrders = (filters?: ResourcesQuery, queryOptions?: QueryOptions<Order>) => {
  const custom = useResourcesCustom({ ...props, filters, queryOptions });
  const abortHandler = useSessionMutation(useJoanieApi().user.orders.abort);
  return {
    ...custom,
    methods: {
      ...custom.methods,
      abort: abortHandler.mutateAsync,
    },
  };
};
export const useOrder = useResource(props);

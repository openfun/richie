import { API, Order, Product, Course } from 'types/Joanie';
import { useJoanieApi } from 'data/JoanieApiProvider';
import { useSessionMutation } from 'utils/react-query/useSessionMutation';
import {
  QueryOptions,
  ResourcesQuery,
  useResourcesCustom,
  UseResourcesProps,
} from './useResources';

type OrderResourcesQuery = ResourcesQuery & {
  course?: Course['code'];
  product?: Product['id'];
};

const props: UseResourcesProps<Order, OrderResourcesQuery, API['user']['orders']> = {
  queryKey: ['orders'],
  apiInterface: () => useJoanieApi().user.orders,
  omniscient: true,
  session: true,
};

export const useOrders = (filters?: OrderResourcesQuery, queryOptions?: QueryOptions<Order>) => {
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

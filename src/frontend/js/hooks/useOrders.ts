import { defineMessages } from 'react-intl';
import { ApiResourceInterface } from 'types/Joanie';
import { Order, Product, Course } from 'api/joanie/gen';
import { useSessionMutation } from 'utils/react-query/useSessionMutation';
import { joanieApi, isCourse } from 'api/joanie';
import {
  QueryOptions,
  ResourcesQuery,
  useResource,
  useResourcesCustom,
  UseResourcesProps,
} from './useResources';

type OrderResourcesQuery = ResourcesQuery & {
  course?: Course['code'] | Course;
  product?: Product['id'];
  state?: Order.state;
};

const messages = defineMessages({
  errorGet: {
    id: 'hooks.useOrders.errorGet',
    description: 'Error message shown to the user when orders fetch request fails.',
    defaultMessage: 'An error occurred while fetching orders. Please retry later.',
  },
  errorNotFound: {
    id: 'hooks.useOrders.errorNotFound',
    description: 'Error message shown to the user when no orders matches.',
    defaultMessage: 'Cannot find the orders.',
  },
});

// FIXME:
function omniscientFiltering(data: Order[], filter: OrderResourcesQuery): Order[] {
  if (!filter) return data;

  return data.filter(
    (order) =>
      // If filter.id is defined filter by order.id
      (!filter.id || order.id === filter.id) &&
      // If filter.course is defined filter by order.course
      (!filter.course ||
        (typeof order.course === 'string' && order.course === filter.course) ||
        (isCourse(order.course) && order.course?.code === filter.course)) &&
      // If filter.product is defined filter by order.product
      (!filter.product || order.product === filter.product) &&
      // If filter.state is defined filter by order.state
      // FIXME: in joanie api, Order.state have a default value but it apear to be optional in our openapi schema
      (!filter.state || filter.state.includes(order.state || Order.state.PENDING)),
  );
}

const props: UseResourcesProps<Order, OrderResourcesQuery, ApiResourceInterface<Order>> = {
  queryKey: ['orders'],
  apiInterface: () => ({
    get: async (filters?: ResourcesQuery) => {
      if (filters?.id) {
        return joanieApi.orders.ordersRead(filters?.id);
      }
      return joanieApi.orders.ordersList();
    },
    create: (data: Order) => joanieApi.orders.ordersCreate(data),
  }),
  messages,
  omniscient: true,
  omniscientFiltering,
  session: true,
};

export const useOrders = (filters?: OrderResourcesQuery, queryOptions?: QueryOptions<Order>) => {
  const custom = useResourcesCustom({ ...props, filters, queryOptions });

  const abortHandler = useSessionMutation((data: Order) => {
    const { id, ...updatedData } = data;
    if (id) {
      return joanieApi.orders.ordersAbort(id, updatedData);
    }
    throw new Error('api.ordersAbort need a id.');
  });

  return {
    ...custom,
    methods: {
      ...custom.methods,
      abort: abortHandler.mutateAsync,
    },
  };
};

export const useOrder = useResource(props);

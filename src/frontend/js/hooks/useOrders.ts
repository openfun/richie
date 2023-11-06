import { defineMessages } from 'react-intl';
import {
  API,
  CertificateOrder,
  CourseLight,
  CredentialOrder,
  Enrollment,
  OrderState,
  PaginatedResourceQuery,
  Product,
  ProductType,
} from 'types/Joanie';
import { useJoanieApi } from 'contexts/JoanieApiContext';
import { useSessionMutation } from 'utils/react-query/useSessionMutation';
import { QueryOptions, useResource, useResourcesCustom, UseResourcesProps } from './useResources';

export type OrderResourcesQuery = PaginatedResourceQuery & {
  course?: CourseLight['code'];
  product?: Product['id'];
  enrollmentId?: Enrollment['id'];
  state?: OrderState[];
  product__type?: ProductType[];
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

function omniscientFiltering(
  data: (CredentialOrder | CertificateOrder)[],
  filter: OrderResourcesQuery,
): (CredentialOrder | CertificateOrder)[] {
  if (!filter) return data;

  return data.filter(
    (order) =>
      // If filter.id is defined filter by order.id
      (!filter.id || order.id === filter.id) &&
      // If filter.course is defined filter by order.course.code
      (!filter.course || order.course?.code === filter.course) &&
      // If filter.enrollmentId is defined filter by order.enrollment?.id
      (!filter.enrollmentId || order.enrollment?.id === filter.enrollmentId) &&
      // If filter.product is defined filter by order.product
      (!filter.product || order.product === filter.product) &&
      // If filter.state is defined filter by order.state
      (!filter.state || filter.state.includes(order.state)),
  );
}

const useOrdersBase =
  (
    props: UseResourcesProps<
      CredentialOrder | CertificateOrder,
      OrderResourcesQuery,
      API['user']['orders']
    >,
  ) =>
  (
    filters?: OrderResourcesQuery,
    queryOptions?: QueryOptions<CredentialOrder | CertificateOrder>,
  ) => {
    const custom = useResourcesCustom({ ...props, filters, queryOptions });
    const abortHandler = useSessionMutation({ mutationFn: useJoanieApi().user.orders.abort });
    const submitHandler = useSessionMutation({ mutationFn: useJoanieApi().user.orders.submit });
    return {
      ...custom,
      methods: {
        ...custom.methods,
        abort: abortHandler.mutateAsync,
        submit: submitHandler.mutateAsync,
      },
    };
  };

const props: UseResourcesProps<
  CredentialOrder | CertificateOrder,
  OrderResourcesQuery,
  API['user']['orders']
> = {
  queryKey: ['orders'],
  apiInterface: () => useJoanieApi().user.orders,
  messages,
  session: true,
};
const propsOmniscient = { ...props, omniscient: true, omniscientFiltering };
export const useOmniscientOrders = useOrdersBase(propsOmniscient);
export const useOmniscientOrder = useResource(propsOmniscient);

export const useOrders = useOrdersBase(props);
export const useOrder = useResource(props);

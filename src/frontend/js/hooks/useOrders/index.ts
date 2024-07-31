import { defineMessages, useIntl } from 'react-intl';
import { useQueryClient } from '@tanstack/react-query';
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
import { QueryOptions, useResource, useResourcesCustom, UseResourcesProps } from '../useResources';

export type OrderResourcesQuery = PaginatedResourceQuery & {
  course_code?: CourseLight['code'];
  product_id?: Product['id'];
  enrollment_id?: Enrollment['id'];
  state?: OrderState[];
  state_exclude?: OrderState[];
  product_type?: ProductType[];
  product_type_exclude?: ProductType[];
  query?: string;
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
  errorCancel: {
    id: 'hooks.useOrders.errorCancel',
    description: 'Error message shown to the user when cancel mutation failed.',
    defaultMessage: 'Cannot cancel the order.',
  },
  errorSetPaymentMethod: {
    id: 'hooks.useOrders.errorSetPaymentMethod',
    description: 'Error message shown to the user when set payment method mutation failed.',
    defaultMessage: "Cannot set the order's payment method.",
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
      // If filter.course_code is defined filter by order.course.code
      (!filter.course_code || order.course?.code === filter.course_code) &&
      // If filter.enrollment_id is defined filter by order.enrollment?.id
      (!filter.enrollment_id || order.enrollment?.id === filter.enrollment_id) &&
      // If filter.product_id is defined filter by order.product
      (!filter.product_id || order.product_id === filter.product_id) &&
      // If filter.state is defined filter by order.state
      (!filter.state || filter.state.includes(order.state)) &&
      // If filter.state_exclude is defined filter by order.state
      (!filter.state_exclude || !filter.state_exclude.includes(order.state)),
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
    const intl = useIntl();
    const custom = useResourcesCustom({ ...props, filters, queryOptions });
    const queryClient = useQueryClient();
    const api = props.apiInterface();
    const onSuccess = async () => {
      custom.methods.setError(undefined);
      await custom.methods.invalidate();
      props.onMutationSuccess?.(queryClient);
    };
    const cancelHandler = useSessionMutation({
      mutationFn: api.cancel,
      onSuccess,
      onError: () => custom.methods.setError(intl.formatMessage(messages.errorCancel)),
    });
    const setPaymentMethodHandler = useSessionMutation({
      mutationFn: api.set_payment_method,
      onSuccess,
      onError: () => custom.methods.setError(intl.formatMessage(messages.errorSetPaymentMethod)),
    });

    return {
      ...custom,
      methods: {
        ...custom.methods,
        cancel: cancelHandler.mutateAsync,
        set_payment_method: setPaymentMethodHandler.mutateAsync,
      },
      states: {
        ...custom.states,
        cancelling: cancelHandler.isPending,
        settingPaymentMethod: setPaymentMethodHandler.isPending,
        isPending: [custom.states, cancelHandler, setPaymentMethodHandler].some(
          (value) => value?.isPending,
        ),
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

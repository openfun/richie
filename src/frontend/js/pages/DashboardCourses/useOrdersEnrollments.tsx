import { defineMessages } from 'react-intl';
import { useJoanieApi } from 'contexts/JoanieApiContext';
import { Enrollment, Order, PaginatedResourceQuery } from 'types/Joanie';
import useUnionResource, { ResourceUnionPaginationProps } from 'hooks/useUnionResource';
import { PER_PAGE } from 'settings';
import { OrderResourcesQuery } from 'hooks/useOrders';

export const isOrder = (obj: Order | Enrollment): obj is Order => {
  return 'total' in obj && 'enrollments' in obj;
};
export const isEnrollement = (obj: Order | Enrollment): obj is Enrollment => {
  return 'was_created_by_order' in obj && 'course_run' in obj;
};

const messages = defineMessages({
  errorGet: {
    id: 'hooks.useOrdersEnrollments.errorGet',
    description: 'Error message shown to the user when orders or enrollments fetch request fails.',
    defaultMessage: 'An error occurred while fetching orders and enrollments. Please retry later.',
  },
});

interface UseOrdersEnrollmentsProps extends ResourceUnionPaginationProps {
  orderFilters?: OrderResourcesQuery;
}

export const useOrdersEnrollments = ({
  perPage = PER_PAGE.useOrdersEnrollments,
  orderFilters = {},
}: UseOrdersEnrollmentsProps = {}) => {
  const api = useJoanieApi();
  return useUnionResource<
    Order,
    Enrollment,
    PaginatedResourceQuery,
    { was_created_by_order: boolean } & PaginatedResourceQuery
  >({
    queryAConfig: {
      queryKey: ['user', 'order'],
      fn: api.user.orders.get,
      filters: orderFilters,
    },
    queryBConfig: {
      queryKey: ['user', 'enrollments'],
      fn: api.user.enrollments.get,
      filters: {
        was_created_by_order: false,
      },
    },
    perPage,
    errorGetMessage: messages.errorGet,
  });
};

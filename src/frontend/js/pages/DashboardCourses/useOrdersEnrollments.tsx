import { defineMessages } from 'react-intl';
import { useJoanieApi } from 'contexts/JoanieApiContext';
import { Enrollment, Order, PaginatedResourceQuery } from 'types/Joanie';
import useUnionResource from 'hooks/useUnionResource';

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

interface UserOrderEnrollmentsProps {
  perPage?: number;
}

export const useOrdersEnrollments = ({ perPage = 50 }: UserOrderEnrollmentsProps = {}) => {
  const api = useJoanieApi();
  return useUnionResource<
    Order,
    Enrollment,
    PaginatedResourceQuery,
    { was_created_by_order: boolean } & PaginatedResourceQuery
  >({
    queryAConfig: {
      queryKey: ['order'],
      fn: api.user.orders.get,
      filters: {},
    },
    queryBConfig: {
      queryKey: ['enrollments'],
      fn: api.user.enrollments.get,
      filters: {
        was_created_by_order: false,
      },
    },
    perPage,
    errorGetMessage: messages.errorGet,
  });
};

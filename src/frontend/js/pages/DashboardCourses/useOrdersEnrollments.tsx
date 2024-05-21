import { defineMessages } from 'react-intl';
import { useJoanieApi } from 'contexts/JoanieApiContext';
import { Enrollment, CredentialOrder, CertificateOrder, EnrollmentsQuery } from 'types/Joanie';
import useUnionResource, { ResourceUnionPaginationProps } from 'hooks/useUnionResource';
import { PER_PAGE } from 'settings';
import { OrderResourcesQuery } from 'hooks/useOrders';

export const isOrder = (
  obj: CredentialOrder | CertificateOrder | Enrollment,
): obj is CredentialOrder | CertificateOrder => {
  return 'total' in obj && 'target_enrollments' in obj;
};
export const isCertificateOrder = (
  obj: CredentialOrder | CertificateOrder | Enrollment,
): obj is CertificateOrder => {
  return isOrder(obj) && !!obj.enrollment;
};
export const isCredentialOrder = (
  obj: CredentialOrder | CertificateOrder | Enrollment,
): obj is CredentialOrder => {
  return isOrder(obj) && !!obj.course;
};
export const isEnrollment = (
  obj: CredentialOrder | CertificateOrder | Enrollment,
): obj is Enrollment => {
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
  query?: string;
}

export const useOrdersEnrollments = ({
  perPage = PER_PAGE.useOrdersEnrollments,
  query,
  orderFilters = {},
}: UseOrdersEnrollmentsProps = {}) => {
  const api = useJoanieApi();
  return useUnionResource<
    CredentialOrder | CertificateOrder,
    Enrollment,
    OrderResourcesQuery,
    EnrollmentsQuery
  >({
    queryAConfig: {
      queryKey: ['user', 'orders'],
      fn: api.user.orders.get,
      filters: { ...orderFilters, query },
    },
    queryBConfig: {
      queryKey: ['user', 'enrollments'],
      fn: api.user.enrollments.get,
      filters: {
        was_created_by_order: false,
        is_active: true,
        query,
      },
    },
    perPage,
    errorGetMessage: messages.errorGet,
    refetchOnInvalidation: false,
  });
};

import { defineMessages } from 'react-intl';
import { useJoanieApi } from 'contexts/JoanieApiContext';
import { useResources, UseResourcesProps } from 'hooks/useResources';
import { API, Enrollment, EnrollmentsQuery } from 'types/Joanie';

const messages = defineMessages({
  errorUpdate: {
    id: 'hooks.useEnrollments.errorUpdate',
    description: 'Error message shown to the user when enrollment update request fails.',
    defaultMessage: 'An error occurred while updating the enrollment. Please retry later.',
  },
  errorDelete: {
    id: 'hooks.useEnrollments.errorDelete',
    description: 'Error message shown to the user when enrollment deletion request fails.',
    defaultMessage: 'An error occurred while deleting the enrollment. Please retry later.',
  },
  errorCreate: {
    id: 'hooks.useEnrollments.errorCreate',
    description: 'Error message shown to the user when enrollment creation request fails.',
    defaultMessage: 'An error occurred while creating the enrollment. Please retry later.',
  },
  errorGet: {
    id: 'hooks.useEnrollments.errorSelect',
    description: 'Error message shown to the user when enrollments fetch request fails.',
    defaultMessage: 'An error occurred while fetching enrollments. Please retry later.',
  },
  errorNotFound: {
    id: 'hooks.useEnrollments.errorNotFound',
    description: 'Error message shown to the user when no enrollment matches.',
    defaultMessage: 'Cannot find the enrollment',
  },
});

const props: UseResourcesProps<Enrollment, EnrollmentsQuery, API['user']['enrollments']> = {
  queryKey: ['enrollments'],
  apiInterface: () => useJoanieApi().user.enrollments,
  session: true,
  messages,
  onMutationSuccess: async (queryClient) => {
    // When enrollment creation/update succeeded, we have to invalidate orders queries
    // to refetch fresh data containing updated enrollments.
    await queryClient.invalidateQueries({ queryKey: ['user', 'orders'] });
  },
};
/**
 * Joanie Api hook to retrieve/update an enrollment owned by the authenticated user.
 */
export const useEnrollments = useResources(props);

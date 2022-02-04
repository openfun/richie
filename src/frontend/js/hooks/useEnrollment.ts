import { useQueryClient } from 'react-query';
import { useJoanieApi } from 'data/JoanieApiProvider';
import { useSessionMutation } from 'utils/react-query/useSessionMutation';

/**
 * Joanie Api hook to retrieve/update an enrollment owned by the authenticated user.
 */
export const useEnrollment = () => {
  const API = useJoanieApi();
  const queryClient = useQueryClient();

  const handleSuccess = async () => {
    // When enrollment creation/update succeeded, we have to invalidate orders queries
    // to refetch fresh data containing updated enrollments.
    await queryClient.invalidateQueries(['user', 'orders']);
  };

  const writeHandlers = {
    create: useSessionMutation(API.user.enrollments.create, {
      onSuccess: handleSuccess,
    }),
    update: useSessionMutation(API.user.enrollments.update, {
      onSuccess: handleSuccess,
    }),
  };

  return {
    methods: {
      create: writeHandlers.create.mutateAsync,
      update: writeHandlers.update.mutateAsync,
    },
    states: {
      creating: writeHandlers.create.isLoading,
      updating: writeHandlers.update.isLoading,
    },
  };
};

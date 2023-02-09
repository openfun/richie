import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import EnrollmentApiInterface from 'utils/api/enrollment';
import { useSession } from 'data/SessionProvider';
import { useSessionQuery } from 'utils/react-query/useSessionQuery';
import { useSessionMutation } from 'utils/react-query/useSessionMutation';
import WebAnalyticsAPIHandler from 'utils/api/web-analytics';

/**
 * Hook to manage an enrollment related to a `resource_link`. It provides interface to
 * retrieve enrollment information, its active state and a `setEnrollment` mutation
 * to enroll to the course run related to the `resourceLink`.
 *
 * This hook use the `EnrollmentApiInterface` so you have to set up at least one
 * lms_backend to use it.
 *
 * @param resourceLink
 */
const useCourseEnrollment = (resourceLink: string) => {
  const { user } = useSession();
  const queryClient = useQueryClient();
  const EnrollmentAPI = EnrollmentApiInterface(resourceLink);

  const [{ data: enrollment, isError, isLoading }, queryKeys] = useSessionQuery(
    ['enrollment', resourceLink],
    async () => {
      return EnrollmentAPI.get(resourceLink, user!);
    },
  );

  const [{ data: isActive, refetch: refetchIsActive }] = useSessionQuery(
    [...queryKeys, 'is_active'],
    async () => EnrollmentAPI.isEnrolled(enrollment),
    {
      // Enrollment is null if it has been fetched
      enabled: !!user && enrollment !== undefined && !isLoading,
    },
  );

  const { mutateAsync } = useSessionMutation(
    (activeEnrollment: boolean = true) =>
      EnrollmentAPI.set(resourceLink, user!, enrollment, activeEnrollment),
    {
      mutationKey: queryKeys,
      onSuccess: async () => {
        await queryClient.invalidateQueries(queryKeys, { exact: true });
        // After enrolls the user, then send enrolled event to the web analytics handler.
        WebAnalyticsAPIHandler()?.sendEnrolledEvent(resourceLink);
      },
    },
  );

  useEffect(() => {
    refetchIsActive();
  }, [enrollment]);

  return {
    enrollment: isError ? null : enrollment,
    enrollmentIsActive: isActive,
    setEnrollment: mutateAsync,
    canUnenroll: EnrollmentAPI.meta?.canUnenroll ?? false,
    states: {
      errors: {
        get: isError,
      },
    },
  };
};

export default useCourseEnrollment;

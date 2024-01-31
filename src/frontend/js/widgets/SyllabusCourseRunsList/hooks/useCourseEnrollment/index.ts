import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import EnrollmentApiInterface from 'api/enrollment';
import WebAnalyticsAPIHandler from 'api/web-analytics';
import { useSession } from 'contexts/SessionContext';
import { useSessionQuery } from 'utils/react-query/useSessionQuery';
import { useSessionMutation } from 'utils/react-query/useSessionMutation';

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

  const [{ data: enrollment, isError, isLoading: isEnrollmentLoading }, queryKey] = useSessionQuery(
    ['enrollment', resourceLink],
    async () => {
      return EnrollmentAPI.get(resourceLink, user!);
    },
  );

  const [{ data: isActive, refetch: refetchIsActive, isLoading: isActiveLoading }] =
    useSessionQuery([...queryKey, 'is_active'], async () => EnrollmentAPI.isEnrolled(enrollment), {
      // Enrollment is null if it has been fetched
      enabled: !!user && enrollment !== undefined && !isEnrollmentLoading,
    });
  const { mutateAsync } = useSessionMutation({
    mutationFn: (activeEnrollment: boolean = true) =>
      EnrollmentAPI.set(resourceLink, user!, enrollment, activeEnrollment),
    mutationKey: queryKey,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey, exact: true });
      // After enrolls the user, then send enrolled event to the web analytics handler.
      WebAnalyticsAPIHandler()?.sendEnrolledEvent(resourceLink);
    },
  });

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
      isLoading: isEnrollmentLoading || isActiveLoading,
    },
  };
};

export default useCourseEnrollment;

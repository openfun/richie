import { useQueryClient } from 'react-query';
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

  const [{ data: enrollment, isError }, queryKey] = useSessionQuery(
    ['enrollment', resourceLink],
    async () => EnrollmentAPI.get(user!),
  );

  const [{ data: isActive }] = useSessionQuery(
    [...queryKey, 'is_active'],
    async () => EnrollmentAPI.isEnrolled(enrollment),
    {
      // Enrollment is null if it has been fetched
      enabled: !!user && enrollment !== undefined,
    },
  );

  const { mutateAsync } = useSessionMutation(() => EnrollmentAPI.set(user!), {
    mutationKey: queryKey,
    onSuccess: () => {
      queryClient.invalidateQueries(queryKey);

      // After enrolls the user, then send enrolled event to the web analytics handler.
      WebAnalyticsAPIHandler()?.sendEnrolledEvent(resourceLink);
    },
  });

  return {
    enrollment: isError ? null : enrollment,
    enrollmentIsActive: isActive,
    setEnrollment: mutateAsync,
  };
};

export default useCourseEnrollment;

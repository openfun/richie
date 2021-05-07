import { useQuery, useMutation, useQueryClient } from 'react-query';
import CourseEnrollmentAPI from 'utils/api/courseEnrollment';
import { useSession } from 'data/useSession';

const useEnrollment = (resourceLink: string) => {
  const { user } = useSession();
  const queryKey = ['enrollment', resourceLink];
  const queryClient = useQueryClient();
  const EnrollmentAPI = CourseEnrollmentAPI(resourceLink);

  const { data: enrollment } = useQuery(queryKey, async () => EnrollmentAPI.get(user!), {
    enabled: !!user,
  });

  const { data: isActive } = useQuery(
    [...queryKey, 'is_active'],
    async () => EnrollmentAPI.isEnrolled(enrollment),
    {
      // Enrollment is null if it has been fetched
      enabled: enrollment !== undefined,
    },
  );

  const { mutateAsync } = useMutation(() => EnrollmentAPI.set(user!), {
    mutationKey: queryKey,
    onSuccess: (data) => {
      queryClient.setQueryData(queryKey, data);
    },
  });

  return {
    enrollment,
    enrollmentIsActive: isActive,
    setEnrollment: mutateAsync,
  };
};

export default useEnrollment;

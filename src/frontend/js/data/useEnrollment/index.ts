import { useQuery, useMutation, useQueryClient } from 'react-query';
import EnrollmentApiInterface from 'utils/api/enrollment';
import { useSession } from 'data/SessionProvider';

const useEnrollment = (resourceLink: string) => {
  const { user } = useSession();
  const queryKey = ['enrollment', resourceLink];
  const queryClient = useQueryClient();
  const EnrollmentAPI = EnrollmentApiInterface(resourceLink);

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
    onSuccess: () => {
      queryClient.invalidateQueries(queryKey);
    },
  });

  return {
    enrollment,
    enrollmentIsActive: isActive,
    setEnrollment: mutateAsync,
  };
};

export default useEnrollment;

/**
 * Joanie hook to retrieve information about a course
 *
 */
import { useJoanieApi } from 'data/JoanieApiProvider';
import useLocalizedQueryKey from 'utils/react-query/useLocalizedQueryKey';
import { useQuery, useQueryClient } from 'react-query';
import { REACT_QUERY_SETTINGS } from 'settings';
import { useSession } from 'data/SessionProvider';

/**
 * Joanie Api hook to retrieve information of a course for the given code.
 *
 * If the user is authenticated, its orders related to products of this course
 * are included in the response.
 * @param code
 */
export const useCourse = (code: string) => {
  const API = useJoanieApi();
  const { user } = useSession();
  const QUERY_KEY = useLocalizedQueryKey(user ? ['user', 'course', code] : ['course', code]);
  const queryClient = useQueryClient();

  const {
    data: course,
    refetch,
    isLoading,
  } = useQuery(QUERY_KEY, () => API.courses.get(code), {
    staleTime: user
      ? REACT_QUERY_SETTINGS.staleTimes.sessionItems
      : REACT_QUERY_SETTINGS.staleTimes.default,
  });

  const invalidate = async () => {
    // Invalidate all course's queries no matter the locale
    const unlocalizedQueryKey = QUERY_KEY.slice(0, -1);
    await queryClient.invalidateQueries(unlocalizedQueryKey);
  };

  return {
    item: course,
    methods: {
      invalidate,
      refetch,
    },
    states: {
      fetching: isLoading,
    },
  };
};

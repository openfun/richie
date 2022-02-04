import type { QueryFunction, QueryKey } from 'react-query/types/core/types';
import type { UseQueryOptions, UseQueryResult } from 'react-query/types/react/types';
import type { HttpError } from 'utils/errors/HttpError';
import type { TSessionQueryKey } from 'utils/react-query/useSessionKey';
import useSessionQueryKey from 'utils/react-query/useSessionKey';
import { useQuery, useQueryClient } from 'react-query';
import { useSession } from 'data/SessionProvider';
import { REACT_QUERY_SETTINGS } from 'settings';
import { useMemo } from 'react';

/**
 * Hook to use when the query relies on the current session. In this way, the queryKey
 * is prefixed by "user" and when the query failed with a 401 error response, all
 * session queries are automatically invalidated.
 *
 * It returns an array containing first the query handler and as a second item the
 * generated queryKey.
 *
 * @param queryKey
 * @param queryFn
 * @param options
 */
export function useSessionQuery<
  TQueryFnData = unknown,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  queryKey: TQueryKey,
  queryFn: QueryFunction<TQueryFnData, TSessionQueryKey>,
  options?: Omit<
    UseQueryOptions<TQueryFnData, HttpError, TData, TSessionQueryKey>,
    'queryKey' | 'queryFn'
  >,
): [UseQueryResult<TData, HttpError>, TSessionQueryKey] {
  const queryClient = useQueryClient();
  const { user } = useSession();
  const sessionQueryKey = useSessionQueryKey(queryKey);

  const handleError = async (error: HttpError) => {
    if (error.code === 401) {
      queryClient.invalidateQueries('user', { exact: true });
    }

    if (options?.onError) {
      return options.onError(error);
    }
  };

  const enabled = useMemo(() => {
    return options?.enabled !== undefined ? options.enabled : !!user;
  }, [user, options?.enabled]);

  const staleTime = useMemo(() => {
    if (options?.staleTime !== undefined && options.staleTime >= 0) {
      return options.staleTime;
    }
    return REACT_QUERY_SETTINGS.staleTimes.sessionItems;
  }, [options?.staleTime]);

  const queryHandler = useQuery<TQueryFnData, HttpError, TData, TSessionQueryKey>(
    sessionQueryKey,
    queryFn,
    {
      ...options,
      enabled,
      staleTime,
      onError: handleError,
    },
  );

  return [queryHandler, sessionQueryKey];
}

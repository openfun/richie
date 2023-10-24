import { useEffect, useMemo } from 'react';
import type {
  QueryFunction,
  QueryKey,
  UseQueryOptions,
  UseQueryResult,
} from '@tanstack/react-query';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'contexts/SessionContext';
import { REACT_QUERY_SETTINGS } from 'settings';
import { HttpStatusCode, type HttpError } from 'utils/errors/HttpError';
import type { TSessionQueryKey } from 'utils/react-query/useSessionKey';
import useSessionQueryKey from 'utils/react-query/useSessionKey';

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

  const enabled = useMemo(() => {
    return options?.enabled !== undefined ? options.enabled : !!user;
  }, [user, options?.enabled]);

  const staleTime = useMemo(() => {
    if (options?.staleTime !== undefined && options.staleTime >= 0) {
      return options.staleTime;
    }
    return REACT_QUERY_SETTINGS.staleTimes.sessionItems;
  }, [options?.staleTime]);

  const queryHandler = useQuery<TQueryFnData, HttpError, TData, TSessionQueryKey>({
    ...options,
    queryKey: sessionQueryKey,
    queryFn,
    enabled,
    staleTime,
  });

  useEffect(() => {
    if (queryHandler.error?.code === HttpStatusCode.UNAUTHORIZED) {
      queryClient.invalidateQueries({ queryKey: ['user'], exact: true });
    }
  }, [queryHandler.error]);

  return [queryHandler, sessionQueryKey];
}

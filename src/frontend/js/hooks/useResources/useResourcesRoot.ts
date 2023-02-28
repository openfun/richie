import { useMutation, useQuery, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { MutateOptions } from '@tanstack/query-core/src/types';
import { AddParameters, Maybe } from 'types/utils';
import { HttpError } from 'utils/errors/HttpError';
import { useSessionQuery } from 'utils/react-query/useSessionQuery';
import { REACT_QUERY_SETTINGS } from 'settings';
import { useSessionMutation } from 'utils/react-query/useSessionMutation';
import { noop } from 'utils';
import { ApiResourceInterface } from 'types/Joanie';
import useLocalizedQueryKey from 'utils/react-query/useLocalizedQueryKey';
import usePrevious from 'utils/usePrevious';
import { Resource, ResourcesQuery, UseResourcesProps } from './index';

export const messages = defineMessages({
  errorGet: {
    id: 'hooks.useResources.errorGet',
    description: 'Error message shown to the user when resource fetch request fails.',
    defaultMessage: 'An error occurred while fetching resources. Please retry later.',
  },
  errorNotFound: {
    id: 'hooks.useResources.errorNotFound',
    description: 'Error message shown to the user when no resources matches.',
    defaultMessage: 'Cannot find the resource.',
  },
  errorUpdate: {
    id: 'hooks.useResources.errorUpdate',
    description: 'Error message shown to the user when resource update request fails.',
    defaultMessage: 'An error occurred while updating a resource. Please retry later.',
  },
  errorDelete: {
    id: 'hooks.useResources.errorDelete',
    description: 'Error message shown to the user when resource deletion request fails.',
    defaultMessage: 'An error occurred while deleting a resource. Please retry later.',
  },
  errorCreate: {
    id: 'hooks.useResources.errorCreate',
    description: 'Error message shown to the user when resource creation request fails.',
    defaultMessage: 'An error occurred while creating a resource. Please retry later.',
  },
});

type MutateFunc<TApiMethod extends Maybe<(...args: any[]) => any>> = AddParameters<
  NonNullable<TApiMethod>,
  [options?: MutateOptions<Awaited<ReturnType<NonNullable<TApiMethod>>>, HttpError>]
>;

const emptyArray: never[] = [];

/**
 * This hook is a wrapper around `useQuery` and `useMutation` to fetch and mutate resources.
 *
 * @param queryKey - The resource name ( e.g. "todos" )
 * @param apiInterface - A callback that returns the API interface to use for this resource.
 * @param frozenQueryKey - Indicates whether it should do a new API request when the filters change.
 * @param filters - The filters to apply to the API request. Depends on frozenQueryKey.
 * @param session - If true uses useSessionQuery, otherwise useQuery.
 * @param queryOptions - Pass custom options to react-query.
 * @param localized - Is the resource local-dependent ? If so, the query will be invalidated on locale change.
 * @param resourceMessages - Custom messages to use for this resource.
 */
export const useResourcesRoot = <
  TData extends Resource,
  TResourceQuery extends ResourcesQuery = ResourcesQuery,
  TApiResource extends ApiResourceInterface<TData> = ApiResourceInterface<TData>,
>({
  queryKey,
  apiInterface,
  frozenQueryKey,
  filters,
  session,
  queryOptions,
  localized,
  messages: resourceMessages,
  onMutationSuccess,
}: UseResourcesProps<TData, TResourceQuery, TApiResource>) => {
  const queryClient = useQueryClient();
  const [error, setError] = useState<Maybe<string>>();
  const intl = useIntl();

  const actualMessages = useMemo(
    () => ({ ...messages, ...resourceMessages }),
    [messages, resourceMessages],
  );

  const COMMON_QUERY_KEY = frozenQueryKey ? [...queryKey] : [...queryKey, JSON.stringify(filters)];
  const LOCALIZED_QUERY_KEY = useLocalizedQueryKey(COMMON_QUERY_KEY);
  const QUERY_KEY = localized ? LOCALIZED_QUERY_KEY : COMMON_QUERY_KEY;
  let ACTUAL_QUERY_KEY = QUERY_KEY;

  const api = apiInterface();

  const queryFn: () => Promise<any> = useCallback(
    () => api.get(filters),
    [api, JSON.stringify(filters)],
  );
  queryOptions = {
    onError: () => setError(intl.formatMessage(actualMessages.errorGet)),
    ...queryOptions,
  };

  if (session !== usePrevious(session)) {
    throw new Error('session must never change value.');
  }

  let readHandler: UseQueryResult<any, HttpError>;
  if (session) {
    [readHandler, ACTUAL_QUERY_KEY] = useSessionQuery(QUERY_KEY, queryFn, queryOptions as any);
  } else {
    readHandler = useQuery(QUERY_KEY, queryFn, queryOptions);
  }

  const invalidate = async () => {
    // Invalidate all queries related to the resource
    await queryClient.invalidateQueries({
      predicate: (query) => query.queryKey.includes(queryKey[0]),
    });
  };

  const prefetch = async () => {
    await queryClient.prefetchQuery(ACTUAL_QUERY_KEY, queryFn, {
      staleTime: session
        ? REACT_QUERY_SETTINGS.staleTimes.sessionItems
        : REACT_QUERY_SETTINGS.staleTimes.default,
    });
  };

  const onSuccess = async () => {
    setError(undefined);
    await invalidate();
    await onMutationSuccess?.(queryClient);
  };

  const mutation = (session ? useSessionMutation : useMutation) as typeof useMutation;

  const writeHandlers = {
    create: api.create
      ? mutation(api.create, {
          onSuccess,
          onError: () => setError(intl.formatMessage(actualMessages.errorCreate)),
        })
      : undefined,
    update: api.update
      ? mutation(api.update, {
          onSuccess,
          onError: () => setError(intl.formatMessage(actualMessages.errorUpdate)),
        })
      : undefined,
    delete: api.delete
      ? mutation(api.delete, {
          onSuccess,
          onError: () => setError(intl.formatMessage(actualMessages.errorDelete)),
        })
      : undefined,
  };

  // We want to keep the same reference to the empty array to avoid potential
  // infinite useEffect calls that use `items` as a dependency.
  const getData = (): TData[] => {
    if (!readHandler.data) {
      return emptyArray;
    }
    // Is it a PaginatedResponse ?
    if (
      typeof readHandler.data === 'object' &&
      readHandler.data.hasOwnProperty('results') &&
      readHandler.data.hasOwnProperty('next') &&
      readHandler.data.hasOwnProperty('previous') &&
      readHandler.data.hasOwnProperty('count')
    ) {
      return readHandler.data.results;
    }

    // If a single resource has been returned by API, we wrap it in an array
    if (!Array.isArray(readHandler.data)) {
      return [readHandler.data];
    }

    return readHandler.data;
  };

  return {
    items: getData(),
    methods: {
      invalidate,
      prefetch,
      refetch: readHandler.refetch,
      create: (writeHandlers.create ? writeHandlers.create.mutate : noop) as unknown as MutateFunc<
        TApiResource['create']
      >,
      update: (writeHandlers.update ? writeHandlers.update.mutate : noop) as unknown as MutateFunc<
        TApiResource['update']
      >,
      delete: (writeHandlers.delete ? writeHandlers.delete.mutate : noop) as unknown as MutateFunc<
        TApiResource['delete']
      >,
      setError,
    },
    states: {
      fetching: readHandler.fetchStatus === 'fetching',
      creating: writeHandlers.create?.isLoading,
      deleting: writeHandlers.delete?.isLoading,
      updating: writeHandlers.update?.isLoading,
      isLoading: [...Object.values(writeHandlers), readHandler].some((value) => value?.isLoading),
      isFetched: readHandler.isFetched,
      error,
    },
  };
};

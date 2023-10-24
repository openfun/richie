import type { DehydratedState, MutationKey, QueryKey, QueryState } from '@tanstack/react-query';
import type { MutationState } from '@tanstack/query-core';
import { PersistedClient } from '@tanstack/react-query-persist-client';

export const QueryStateFactory = (key: QueryKey, state: Partial<QueryState>) => ({
  queryKey: key,
  queryHash: Array.isArray(key) ? JSON.stringify(key) : `[${JSON.stringify(key)}]`,
  state: {
    data: undefined,
    dataUpdateCount: 1,
    dataUpdatedAt: Date.now(),
    error: null,
    errorUpdateCount: 0,
    errorUpdatedAt: 0,
    fetchFailureCount: 0,
    fetchMeta: null,
    isFetching: false,
    isInvalidated: false,
    isPaused: false,
    status: 'success',
    ...state,
  } as QueryState,
});

export const MutationStateFactory = (key: MutationKey, state: Partial<MutationState> = {}) => ({
  mutationKey: key,
  state: {
    context: undefined,
    data: undefined,
    error: null,
    failureCount: 0,
    isPaused: false,
    status: 'success',
    variables: undefined,
    ...state,
  } as MutationState,
});

interface PersistedClientFactoryOptions {
  buster?: number;
  mutations?: DehydratedState['mutations'];
  queries?: DehydratedState['queries'];
  timestamp?: number;
}

export const PersistedClientFactory = ({
  buster,
  mutations,
  queries,
  timestamp,
}: PersistedClientFactoryOptions) =>
  ({
    timestamp: timestamp || Date.now(),
    buster: buster || '',
    clientState: {
      mutations: mutations || [],
      queries: queries || [],
    },
  }) as PersistedClient;

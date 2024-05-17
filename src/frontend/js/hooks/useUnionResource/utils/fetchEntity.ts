import { QueryClient } from '@tanstack/query-core';
import { PaginatedResourceQuery, PaginatedResponse } from 'types/Joanie';
import { Maybe } from 'types/utils';
import { REACT_QUERY_SETTINGS } from 'settings';
import { HttpStatusCode, isHttpError } from 'utils/errors/HttpError';

export type FetchDataFunction<Data, FetchDataFilter> = (
  filters: FetchDataFilter,
) => Promise<PaginatedResponse<Data>>;

export interface QueryConfig<Data, Filters> {
  queryKey: string[];
  fn: FetchDataFunction<Data, Filters>;
  filters: Filters;
}

export interface FetchEntityBaseArgs {
  page: number;
  perPage: number;
  eofQueryKey: string[];
  eofRef: React.MutableRefObject<Record<string, number>>;
  queryClient: QueryClient;
}
interface FetchEntityArgs<Data, Filters> extends FetchEntityBaseArgs {
  queryConfig: QueryConfig<Data, Filters>;
}
export const fetchEntity = async <
  Data,
  Filters extends PaginatedResourceQuery = PaginatedResourceQuery,
>({
  queryConfig,
  page,
  perPage,
  eofQueryKey,
  eofRef,
  queryClient,
}: FetchEntityArgs<Data, Filters>): Promise<Maybe<PaginatedResponse<Data>>> => {
  const { queryKey, fn, filters: queryConfigFilters } = queryConfig;
  const queryKeyString = queryKey.join('-');
  // Do not fetch if we already reached the end of the list.
  if (typeof eofRef.current[queryKeyString] === 'number' && page > eofRef.current[queryKeyString]) {
    return;
  }

  const filters: Filters = {
    ...(queryConfigFilters || {}),
    page,
    page_size: perPage,
  };
  const QUERY_KEY = [...queryKey, JSON.stringify(filters)];
  const state = queryClient.getQueryState<PaginatedResponse<Data>>(QUERY_KEY);
  let data: Maybe<PaginatedResponse<Data>>;
  // Here we need to mimic the behavior of staleTime, which does not seems to be implemented when using `getQueryData`.
  if (
    state &&
    state.dataUpdatedAt >= new Date().getTime() - REACT_QUERY_SETTINGS.staleTimes.sessionItems &&
    !state.isInvalidated
  ) {
    data = state.data;
  }

  if (data) {
    eofRef.current = { ...eofRef.current, [queryKeyString]: Math.ceil(data.count / perPage) };
    return data;
  }
  try {
    const res = await fn(filters);
    queryClient.setQueryData(QUERY_KEY, res);
    // Eof is cached based, the same way, we cache the fetching data. Otherwise there would
    // be request to non existing pages after reload.
    const totalPages = Math.ceil(res.count / perPage);
    eofRef.current = { ...eofRef.current, [queryKeyString]: totalPages };
    queryClient.setQueryData(eofQueryKey, eofRef.current);
    return res;
  } catch (err) {
    if (isHttpError(err)) {
      if (err.code === HttpStatusCode.UNAUTHORIZED) {
        queryClient.invalidateQueries({ queryKey: ['user'], exact: true });
      }
      throw err;
    }
  }
};

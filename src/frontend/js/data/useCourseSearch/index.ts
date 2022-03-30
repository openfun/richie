import { stringify } from 'query-string';
import { useQuery, UseQueryOptions } from 'react-query';

import { APIListRequestParams } from 'types/api';
import useLocalizedQueryKey from 'utils/react-query/useLocalizedQueryKey';
import { fetchList, FetchListResponse } from '../getResourceList';

export const useCourseSearch = (
  searchParams: APIListRequestParams,
  queryOptions: UseQueryOptions<
    FetchListResponse,
    unknown,
    FetchListResponse,
    readonly (string | APIListRequestParams)[]
  > = {},
) => {
  const queryKey = useLocalizedQueryKey(['courses', stringify(searchParams)]) as readonly (
    | string
    | APIListRequestParams
  )[];
  return useQuery<
    FetchListResponse,
    unknown,
    FetchListResponse,
    readonly (string | APIListRequestParams)[]
  >(queryKey, async () => fetchList('courses', searchParams), {
    keepPreviousData: true,
    ...queryOptions,
  });
};

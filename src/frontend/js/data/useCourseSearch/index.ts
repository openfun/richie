import { UseQueryOptions, useQuery } from 'react-query';

import { APIListRequestParams } from 'types/api';
import { fetchList, FetchListResponse } from '../getResourceList';

export const useCourseSearch = (
  searchParams: APIListRequestParams,
  queryOptions: UseQueryOptions<
    FetchListResponse,
    unknown,
    FetchListResponse,
    (string | APIListRequestParams)[]
  > = {},
) => {
  const queryKey = ['courses', searchParams];
  return useQuery<FetchListResponse, unknown, FetchListResponse, (string | APIListRequestParams)[]>(
    queryKey,
    async () => fetchList('courses', searchParams),
    {
      keepPreviousData: true,
      ...queryOptions,
    },
  );
};

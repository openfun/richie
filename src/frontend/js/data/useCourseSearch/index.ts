import { useState } from 'react';

import { APIListRequestParams } from 'types/api';
import { Nullable } from 'types/utils';
import { useAsyncEffect } from 'utils/useAsyncEffect';
import { fetchList, FetchListResponse } from '../getResourceList';

export const useCourseSearch = (searchParams: APIListRequestParams) => {
  const [courseSearchResponse, setCourseSearchResponse] =
    useState<Nullable<FetchListResponse>>(null);

  useAsyncEffect(async () => {
    const response = await fetchList('courses', searchParams);
    setCourseSearchResponse(response);
  }, [searchParams]);

  return courseSearchResponse;
};

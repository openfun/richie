import { useState } from 'react';

import { APIListRequestParams } from 'types/api';
import { Nullable } from 'utils/types';
import { useAsyncEffect } from 'utils/useAsyncEffect';
import { fetchList, fetchListResponse } from '../getResourceList';

export const useCourseSearch = (searchParams: APIListRequestParams) => {
  const [courseSearchResponse, setCourseSearchResponse] = useState<
    Nullable<fetchListResponse>
  >(null);

  useAsyncEffect(async () => {
    const response = await fetchList('courses', searchParams);
    setCourseSearchResponse(response);
  }, [searchParams]);

  return courseSearchResponse;
};

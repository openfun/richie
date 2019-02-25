import { useState } from 'react';

import { APIListRequestParams } from '../../types/api';
import { modelName } from '../../types/models';
import { Nullable } from '../../utils/types';
import { useAsyncEffect } from '../../utils/useAsyncEffect';
import {
  fetchList,
  fetchListResponse,
} from '../getResourceList/getResourceList';

export const useCourseSearch = (searchParams: APIListRequestParams) => {
  const [courseSearchResponse, setCourseSearchResponse] = useState<
    Nullable<fetchListResponse>
  >(null);

  useAsyncEffect(async () => {
    const response = await fetchList(modelName.COURSES, searchParams);
    setCourseSearchResponse(response);
  }, [searchParams]);

  return courseSearchResponse;
};

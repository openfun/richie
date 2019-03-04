import { useContext } from 'react';

import { FilterDefinition, FilterValue } from '../../types/filters';
import { CourseSearchParamsContext } from '../useCourseSearchParams/useCourseSearchParams';

type UseFilterValue = [boolean, () => void];

export const useFilterValue = (
  filter: FilterDefinition,
  value: FilterValue,
): UseFilterValue => {
  const [courseSearchParams, dispatchCourseSearchParamsUpdate] = useContext(
    CourseSearchParamsContext,
  );

  const isActive = (courseSearchParams[filter.name] || []).includes(value.key);

  const toggle = () =>
    dispatchCourseSearchParamsUpdate({
      filter,
      payload: value.key,
      type: isActive ? 'FILTER_REMOVE' : 'FILTER_ADD',
    });

  return [isActive, toggle];
};

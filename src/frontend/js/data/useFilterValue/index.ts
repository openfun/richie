import { useContext } from 'react';

import { CourseSearchParamsContext } from 'data/useCourseSearchParams';
import { FacetedFilterDefinition, FilterValue } from 'types/filters';

type UseFilterValue = [boolean, () => void];

export const useFilterValue = (
  filter: FacetedFilterDefinition,
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

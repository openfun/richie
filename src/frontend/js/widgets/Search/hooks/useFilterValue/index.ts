import { CourseSearchParamsAction, useCourseSearchParams } from 'hooks/useCourseSearchParams';
import { FacetedFilterDefinition, FilterValue } from 'types/filters';

type UseFilterValue = [boolean, () => void];

export const useFilterValue = (
  filter: FacetedFilterDefinition,
  value: FilterValue,
): UseFilterValue => {
  const { courseSearchParams, dispatchCourseSearchParamsUpdate } = useCourseSearchParams();

  const isActive = (courseSearchParams[filter.name] || []).includes(value.key);

  const toggle = () =>
    dispatchCourseSearchParamsUpdate({
      filter,
      payload: value.key,
      type: isActive ? CourseSearchParamsAction.filterRemove : CourseSearchParamsAction.filterAdd,
    });

  return [isActive, toggle];
};

import React, { useContext } from 'react';

import { CourseSearchParamsContext } from '../../data/useCourseSearchParams/useCourseSearchParams';
import { FilterDefinitionWithValues } from '../../types/filters';
import { SearchFilter } from '../SearchFilter/SearchFilter';

export interface SearchFilterGroupProps {
  filter: FilterDefinitionWithValues;
}

export const SearchFilterGroup = ({ filter }: SearchFilterGroupProps) => {
  // We need the search params to determine which filter values are active
  const [courseSearchParams, dispatchCourseSearchParamsUpdate] = useContext(
    CourseSearchParamsContext,
  );

  const updateFilter = (type: 'FILTER_ADD' | 'FILTER_REMOVE') => (
    payload: string,
  ) => {
    dispatchCourseSearchParamsUpdate({
      filter,
      payload,
      type,
    });
  };

  return (
    <div className="search-filter-group">
      <h3 className="search-filter-group__title">{filter.human_name}</h3>
      <div className="search-filter-group__list">
        {filter.values.map(value => (
          <SearchFilter
            addFilter={updateFilter('FILTER_ADD')}
            filter={value}
            isActive={(courseSearchParams[filter.name] || []).includes(
              value.key,
            )}
            key={value.key}
            removeFilter={updateFilter('FILTER_REMOVE')}
          />
        ))}
      </div>
    </div>
  );
};

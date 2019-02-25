import differenceBy from 'lodash-es/differenceBy';
import React, { useContext } from 'react';

import { CourseSearchParamsContext } from '../../data/useCourseSearchParams/useCourseSearchParams';
import { FilterDefinitionWithValues } from '../../types/filters';
import { Maybe } from '../../utils/types';
import { SearchFilter } from '../SearchFilter/SearchFilter';

export interface SearchFilterGroupProps {
  filter: FilterDefinitionWithValues;
}

export const SearchFilterGroup = ({ filter }: SearchFilterGroupProps) => {
  // We need the search params to determine which filter values are active
  const [courseSearchParams, dispatchCourseSearchParamsUpdate] = useContext(
    CourseSearchParamsContext,
  );

  // Make a list of FilterValues out of the currently active filter values
  const currentValues =
    (courseSearchParams[filter.name] as Maybe<string[]>) || [];
  const activeFilterValues = filter.values.filter(({ key }) =>
    currentValues.includes(key),
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
        {/* First we render the active filter values */}
        {activeFilterValues.map(value => (
          <SearchFilter
            addFilter={updateFilter('FILTER_ADD')}
            filter={value}
            isActive={true}
            key={value.key}
            removeFilter={updateFilter('FILTER_REMOVE')}
          />
        ))}
        {/* Then we render the default list of facets, minus any active values that might have been in the facets */}
        {differenceBy(filter.values, activeFilterValues, 'key').map(value => (
          <SearchFilter
            addFilter={updateFilter('FILTER_ADD')}
            filter={value}
            isActive={false}
            key={value.key}
            removeFilter={updateFilter('FILTER_REMOVE')}
          />
        ))}
      </div>
    </div>
  );
};

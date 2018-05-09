import * as React from 'react';

import { FilterValue } from '../../types/FilterDefinition';

export interface SearchFilterProps {
  addFilter: (filterValue: string) => void;
  filter: FilterValue;
  isActive: boolean;
  removeFilter: (filterValue: string) => void;
}

export const SearchFilter = (props: SearchFilterProps) => {
  const { addFilter, filter, isActive, removeFilter } = props;

  return (
    <button
      className={`search-filter ${isActive ? 'active' : ''}`}
      onClick={() =>
        isActive
          ? removeFilter(filter.primaryKey)
          : addFilter(filter.primaryKey)
      }
    >
      {filter.humanName}
      {filter.count || filter.count === 0 ? (
        <span className="search-filter__count">{filter.count}</span>
      ) : (
        ''
      )}
    </button>
  );
};

export default SearchFilter;

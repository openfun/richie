import * as React from 'react';

import { FilterValue } from '../../types/FilterDefinition';

export interface SearchFilterProps {
  addFilter: (filterValue: string) => void;
  filter: FilterValue;
}

export const SearchFilter = (props: SearchFilterProps) => {
  const { filter, addFilter } = props;

  return (
    <button
      className="search-filter"
      onClick={() => addFilter(filter.primaryKey)}
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

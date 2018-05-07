import * as React from 'react';

import { FilterDefinition } from '../../types/FilterDefinition';
import SearchFilter from '../searchFilter/searchFilter';

export interface SearchFilterGroupProps {
  addFilter: (filterValue: string) => void;
  filter: FilterDefinition;
  removeFilter: (filterValue: string) => void;
}

export const SearchFilterGroup = (props: SearchFilterGroupProps) => {
  const { humanName, values } = props.filter;

  return (
    <div className="search-filter-group">
      <h3 className="search-filter-group__title">{humanName}</h3>
      <div className="search-filter-group__list">
        {values.map(value => (
          <SearchFilter
            filter={value}
            key={value.primaryKey}
            addFilter={props.addFilter}
          />
        ))}
      </div>
    </div>
  );
};

export default SearchFilterGroup;

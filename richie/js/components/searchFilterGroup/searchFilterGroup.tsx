import * as React from 'react';

import FilterDefinition from '../../types/FilterDefinition';
import SearchFilter from '../searchFilter/searchFilter';

export interface SearchFilterGroupProps {
  filter: FilterDefinition;
}

export const SearchFilterGroup = (props: SearchFilterGroupProps) => {
  const { humanName, values } = props.filter;

  return <div className="search-filter-group">
    <h3 className="search-filter-group__title">{humanName}</h3>
    <div className="search-filter-group__list">
      {values.map((value) => <SearchFilter filter={value} key={value[0]} /> )}
    </div>
  </div>;
};

export default SearchFilterGroup;

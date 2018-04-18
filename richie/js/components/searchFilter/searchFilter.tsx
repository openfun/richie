import * as React from 'react';

import { FilterValue } from '../../types/FilterDefinition';

export interface SearchFilterGroupProps {
  filter: FilterValue;
}

export const SearchFilter = (props: SearchFilterGroupProps) => {
  const { filter } = props;

  return <button className="search-filter">
    {filter.humanName}
    {filter.count || filter.count === 0 ?
      <span className="search-filter__count">{filter.count}</span> :
      ''
    }
  </button>;
};

export default SearchFilter;

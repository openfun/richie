import * as React from 'react';

import FilterDefinition from '../../types/FilterDefinition';

export interface SearchFilterGroupProps {
  filter: FilterDefinition;
}

export const SearchFilterGroup = (props: SearchFilterGroupProps) => {
  const { humanName, values } = props.filter;

  return <div className="search-filter-group">
    <h3 className="search-filter-group__title">{humanName}</h3>
    <div className="search-filter-group__list">
      {values.map((value) =>
        <button className="search-filter-group__list__value">
          {value[1]}
          <span className="search-filter-group__list__value__count">358</span>
        </button>,
      )}
    </div>
  </div>;
};

export default SearchFilterGroup;

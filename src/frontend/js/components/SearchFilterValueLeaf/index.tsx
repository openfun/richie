import React from 'react';

import { useFilterValue } from 'data/useFilterValue';
import { FilterDefinition, FilterValue } from 'types/filters';

export interface SearchFilterValueLeafProps {
  filter: FilterDefinition;
  value: FilterValue;
}

export const SearchFilterValueLeaf = ({
  filter,
  value,
}: SearchFilterValueLeafProps) => {
  const [isActive, toggle] = useFilterValue(filter, value);

  return (
    <label
      className={`search-filter-value-leaf ${isActive ? 'active' : ''} ${
        value.count === 0 ? 'search-filter-value-leaf--disabled' : ''
      }`}
    >
      <input
        checked={isActive}
        className="search-filter-value-leaf__checkbox"
        disabled={value.count === 0}
        onChange={toggle}
        type="checkbox"
      />
      <div className="search-filter-value-leaf__content">
        {value.human_name}&nbsp;
        {value.count || value.count === 0 ? `(${value.count})` : ''}
      </div>
    </label>
  );
};

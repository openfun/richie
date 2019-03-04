import React from 'react';

import { useFilterValue } from '../../data/useFilterValue/useFilterValue';
import { FilterDefinition, FilterValue } from '../../types/filters';
import { CloseIcon } from '../icons/CloseIcon';

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
    <button
      className={`search-filter-value-leaf ${isActive ? 'active' : ''}`}
      onClick={toggle}
      aria-pressed={isActive}
    >
      <span className="search-filter-value-leaf__name">{value.human_name}</span>
      {!isActive && (value.count || value.count === 0) ? (
        <span className="search-filter-value-leaf__count">{value.count}</span>
      ) : (
        ''
      )}
      {isActive ? <CloseIcon /> : ''}
    </button>
  );
};

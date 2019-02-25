import React from 'react';

import { FilterValue } from '../../types/filters';
import { CloseIcon } from '../icons/CloseIcon';

export interface SearchFilterProps {
  addFilter: (filterValue: string) => void;
  filter: FilterValue;
  isActive: boolean;
  removeFilter: (filterValue: string) => void;
}

export const SearchFilter = ({
  addFilter,
  filter,
  isActive,
  removeFilter,
}: SearchFilterProps) => (
  <button
    className={`search-filter ${isActive ? 'active' : ''}`}
    onClick={() =>
      isActive ? removeFilter(filter.key) : addFilter(filter.key)
    }
    aria-pressed={isActive}
  >
    <span>{filter.human_name}</span>
    {!isActive && (filter.count || filter.count === 0) ? (
      <span className="search-filter__count">{filter.count}</span>
    ) : (
      ''
    )}
    {isActive ? <CloseIcon /> : ''}
  </button>
);

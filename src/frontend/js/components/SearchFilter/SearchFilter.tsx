import React from 'react';

import { FilterValue } from '../../types/filters';
import { CloseIcon } from '../icons/CloseIcon';

export interface SearchFilterProps {
  addFilter: (filterValue: string) => void;
  filterValue: FilterValue;
  isActive: boolean;
  removeFilter: (filterValue: string) => void;
}

export const SearchFilter = ({
  addFilter,
  filterValue,
  isActive,
  removeFilter,
}: SearchFilterProps) => (
  <button
    className={`search-filter ${isActive ? 'active' : ''}`}
    onClick={() =>
      isActive ? removeFilter(filterValue.key) : addFilter(filterValue.key)
    }
    aria-pressed={isActive}
  >
    <span>{filterValue.human_name}</span>
    {!isActive && (filterValue.count || filterValue.count === 0) ? (
      <span className="search-filter__count">{filterValue.count}</span>
    ) : (
      ''
    )}
    {isActive ? <CloseIcon /> : ''}
  </button>
);

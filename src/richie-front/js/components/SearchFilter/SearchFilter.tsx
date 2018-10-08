import * as React from 'react';
import { FormattedMessage } from 'react-intl';

import { FilterValue } from '../../types/filters';

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
      aria-label={isActive ? 'Close' : ''}
    >
      {typeof filter.humanName === 'string' ? (
        <span>{filter.humanName}</span>
      ) : (
        <FormattedMessage {...filter.humanName} />
      )}
      {filter.count || filter.count === 0 ? (
        <span className="search-filter__count">{filter.count}</span>
      ) : (
        ''
      )}
      {isActive ? (
        <span className="search-filter__close" aria-hidden="true">
          &times;
        </span>
      ) : (
        ''
      )}
    </button>
  );
};

import React from 'react';

import { FilterDefinition } from '../../types/filters';
import { SearchFilterValueLeaf } from '../SearchFilterValueLeaf/SearchFilterValueLeaf';
import { SearchFilterValueParent } from '../SearchFilterValueParent/SearchFilterValueParent';

export interface SearchFilterGroupProps {
  filter: FilterDefinition;
}

export const SearchFilterGroup = ({ filter }: SearchFilterGroupProps) => (
  <div className="search-filter-group">
    <h3 className="search-filter-group__title">{filter.human_name}</h3>
    <div className="search-filter-group__list">
      {filter.values.map(value =>
        value.children && value.children.length ? (
          <SearchFilterValueParent
            filter={filter}
            value={value}
            key={value.key}
          />
        ) : (
          <SearchFilterValueLeaf
            filter={filter}
            value={value}
            key={value.key}
          />
        ),
      )}
    </div>
  </div>
);

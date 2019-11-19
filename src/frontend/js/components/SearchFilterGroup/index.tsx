import React from 'react';

import { SearchFilterGroupModal } from 'components/SearchFilterGroupModal';
import { SearchFilterValueLeaf } from 'components/SearchFilterValueLeaf';
import { SearchFilterValueParent } from 'components/SearchFilterValueParent';
import { FacetedFilterDefinition } from 'types/filters';

export interface SearchFilterGroupProps {
  filter: FacetedFilterDefinition;
}

export const SearchFilterGroup = ({ filter }: SearchFilterGroupProps) => (
  <fieldset className="search-filter-group">
    <legend className="search-filter-group__title">{filter.human_name}</legend>
    <div className="search-filter-group__list">
      {filter.values.map(value =>
        value.key.startsWith(
          'P-',
        ) /* Values with children have a key that starts with `P-` by convention */ ? (
          <SearchFilterValueParent
            filter={filter}
            value={value}
            key={value.key}
          />
        ) : (
          /* Other values' keys start with `L-` */ <SearchFilterValueLeaf
            filter={filter}
            value={value}
            key={value.key}
          />
        ),
      )}
    </div>
    {filter.has_more_values && filter.is_searchable ? (
      <SearchFilterGroupModal filter={filter} />
    ) : null}
  </fieldset>
);

import * as React from 'react';

import { FILTERS_ACTIVE } from '../../settings';
import { SearchFilterGroupContainer } from '../SearchFilterGroupContainer/SearchFilterGroupContainer';

export const SearchFiltersPane = (props: {}) => {
  return (
    <div className="search-filters-pane">
      <h2 className="search-filters-pane__title">Filter results</h2>
      {FILTERS_ACTIVE.map(filterName => (
        <SearchFilterGroupContainer machineName={filterName} key={filterName} />
      ))}
    </div>
  );
};

import * as React from 'react';

import { Settings } from '../../settings';
import settings from '../../settings.json';
import { SearchFilterGroupContainer } from '../SearchFilterGroupContainer/SearchFilterGroupContainer';

const { FILTERS_ACTIVE } = settings as Settings;

export const SearchFiltersPane = (props: {}) => {
  return (
    <div className="search-filters-pane">
      <h2 className="search-filters-pane__title">Filter results</h2>
      {FILTERS_ACTIVE.map(filterName => (
        <SearchFilterGroupContainer machineName={filterName} />
      ))}
    </div>
  );
};

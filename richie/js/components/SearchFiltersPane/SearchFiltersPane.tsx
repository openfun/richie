import * as React from 'react';

import { SearchFilterGroupContainer } from '../SearchFilterGroupContainer/SearchFilterGroupContainer';

export const SearchFiltersPane = (props: {}) => {
  return (
    <div className="search-filters-pane">
      <h2 className="search-filters-pane__title">Filter results</h2>
      <SearchFilterGroupContainer machineName="new" />
      <SearchFilterGroupContainer machineName="status" />
      <SearchFilterGroupContainer machineName="subjects" />
      <SearchFilterGroupContainer machineName="organizations" />
      <SearchFilterGroupContainer machineName="language" />
    </div>
  );
};

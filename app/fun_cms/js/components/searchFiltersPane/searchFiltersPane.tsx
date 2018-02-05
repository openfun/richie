import * as React from 'react';

import SearchFilterGroupContainer from '../searchFilterGroupContainer/searchFilterGroupContainer';

export interface SearchFiltersPaneProps {}

export const SearchFiltersPane = (props: SearchFiltersPaneProps) => {
  return <div className="search-filters-pane">
    <h2 className="search-filters-pane__title">Filter results</h2>
      <SearchFilterGroupContainer machineName='new' />
      <SearchFilterGroupContainer machineName='status' />
      <SearchFilterGroupContainer machineName='subject' />
      <SearchFilterGroupContainer machineName='organization' />
      <SearchFilterGroupContainer machineName='language' />
  </div>
}

export default SearchFiltersPane;

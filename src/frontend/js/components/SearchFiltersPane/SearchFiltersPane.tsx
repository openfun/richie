import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';

import { APICourseSearchResponse } from '../../types/api';
import { Nullable } from '../../utils/types';
import { SearchFilterGroup } from '../SearchFilterGroup/SearchFilterGroup';

interface SearchFiltersPaneProps {
  filters: Nullable<APICourseSearchResponse['filters']>;
}

const messages = defineMessages({
  filter: {
    defaultMessage: 'Filter courses',
    description: 'Title for the search filters pane in course search.',
    id: 'components.SearchFiltersPane.title',
  },
});

export const SearchFiltersPane = ({ filters }: SearchFiltersPaneProps) => {
  const filterList = filters && Object.values(filters);

  return (
    <div className="search-filters-pane">
      <h2 className="search-filters-pane__title">
        <FormattedMessage {...messages.filter} />
      </h2>
      {filterList &&
        filterList.map(filter => (
          <SearchFilterGroup filter={filter} key={filter.name} />
        ))}
    </div>
  );
};

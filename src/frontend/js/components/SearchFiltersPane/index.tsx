import React, { useContext } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';

import { SearchFilterGroup } from 'components/SearchFilterGroup';
import { CourseSearchParamsContext } from 'data/useCourseSearchParams';
import { API_LIST_DEFAULT_PARAMS } from 'settings';
import { APICourseSearchResponse } from 'types/api';
import { Nullable } from 'utils/types';

interface SearchFiltersPaneProps {
  filters: Nullable<APICourseSearchResponse['filters']>;
}

const messages = defineMessages({
  clearFilters: {
    defaultMessage:
      'Clear {activeFilterCount, number} active {activeFilterCount, plural, one {filter} other {filters}}',
    description:
      'Helper button in search filters pane in search page to remove all active filters',
    id: 'components.SearchFiltersPane.clearFilters',
  },
  filter: {
    defaultMessage: 'Filter courses',
    description: 'Title for the search filters pane in course search.',
    id: 'components.SearchFiltersPane.title',
  },
});

export const SearchFiltersPane = ({
  filters,
  ...passThroughProps
}: SearchFiltersPaneProps &
  React.DetailedHTMLProps<
    React.HTMLAttributes<HTMLDivElement>,
    HTMLDivElement
  >) => {
  const filterList = filters && Object.values(filters);

  const [courseSearchParams, dispatchCourseSearchParamsUpdate] = useContext(
    CourseSearchParamsContext,
  );

  // Get all the currently active filters to show a count
  const activeFilters = Object.entries(courseSearchParams)
    // Drop filters that are irrelevant to the "clear" button
    .filter(([key]) => !Object.keys(API_LIST_DEFAULT_PARAMS).includes(key))
    // Only keep the values
    .map(entry => entry[1])
    // Drop undefined & null values
    .filter(item => !!item);
  // Flatten the list of active filters before counting
  // This allows us to eg. count 3 if there are 3 active organization filters
  const activeFilterCount = ([] as any[]) // Type safety does not matter as we're only counting
    .concat(...activeFilters).length;

  return (
    <div className="search-filters-pane" {...passThroughProps}>
      <h2 className="search-filters-pane__title">
        <FormattedMessage {...messages.filter} />
      </h2>
      <a
        className={`search-filters-pane__clear ${
          !activeFilterCount ? 'search-filters-pane__clear--hidden' : ''
        }`}
        tabIndex={0}
        onClick={() =>
          dispatchCourseSearchParamsUpdate({ type: 'FILTER_RESET' })
        }
      >
        <FormattedMessage
          {...messages.clearFilters}
          values={{ activeFilterCount }}
        />
      </a>
      {filterList &&
        filterList.map(filter => (
          <SearchFilterGroup filter={filter} key={filter.name} />
        ))}
    </div>
  );
};

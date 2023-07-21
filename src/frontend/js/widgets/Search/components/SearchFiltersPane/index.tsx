import { DetailedHTMLProps, HTMLAttributes } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import c from 'classnames';

import { Button } from '@openfun/cunningham-react';
import { CourseSearchParamsAction, useCourseSearchParams } from 'hooks/useCourseSearchParams';
import { API_LIST_DEFAULT_PARAMS } from 'settings';
import { Nullable } from 'types/utils';
import { FacetedFilterDefinition } from 'types/filters';
import { APICourseSearchResponse } from '../../types/api';
import { SearchFilterGroup } from '../SearchFilterGroup';

interface SearchFiltersPaneProps {
  filters: Nullable<APICourseSearchResponse['filters']>;
}

const messages = defineMessages({
  clearFilters: {
    defaultMessage:
      'Clear {activeFilterCount, number} active {activeFilterCount, plural, one {filter} other {filters}}',
    description: 'Helper button in search filters pane in search page to remove all active filters',
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
}: SearchFiltersPaneProps & DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>) => {
  const filterList = filters && Object.values(filters).sort((f1, f2) => f1.position - f2.position);
  const { courseSearchParams, dispatchCourseSearchParamsUpdate } = useCourseSearchParams();

  const relevantFilters = Object.entries(courseSearchParams)
    // Drop filters that are irrelevant to the "clear" button
    .filter(([key]) => !Object.keys(API_LIST_DEFAULT_PARAMS).includes(key));

  // Get all the currently active filters to show a count
  const activeFilters = relevantFilters
    // Only keep the values
    .map((entry) => entry[1])
    // Drop undefined & null values
    .filter((item) => !!item);

  // Flatten the list of active filters before counting
  // This allows us to eg. count 3 if there are 3 active organization filters
  const activeFilterCount = ([] as any[]) // Type safety does not matter as we're only counting
    .concat(...activeFilters).length;

  // Get of list of active filters human names, in the order of the shown filter list
  function getFilterNames(prev: string[], current: FacetedFilterDefinition) {
    const filter = relevantFilters.find((entry) => entry[0] === current.name);
    let names: string[] = [];

    if (filter) {
      const filterValues = Array.isArray(filter[1]) ? filter[1] : [filter[1]];
      names = current.values
        .filter((value) => filterValues.includes(value.key))
        .map((value) => `"${value.human_name}"`);
    }

    return [...prev, ...names];
  }
  const activeFilterNames = (filterList || []).reduce(getFilterNames, []).join(', ');

  return (
    <div className="search-filters-pane" {...passThroughProps}>
      <h2
        id={`${passThroughProps.id || 'search-filters-pane'}__title`}
        className="search-filters-pane__title"
      >
        <FormattedMessage {...messages.filter} />
      </h2>
      <Button
        color="secondary"
        size="small"
        className={c({
          'search-filters-pane__clear--hidden': !activeFilterCount,
        })}
        tabIndex={0}
        onClick={() =>
          dispatchCourseSearchParamsUpdate({
            type: CourseSearchParamsAction.filterReset,
          })
        }
      >
        <FormattedMessage {...messages.clearFilters} values={{ activeFilterCount }} />
        <span className="offscreen">&nbsp;({activeFilterNames})</span>
      </Button>
      {filterList &&
        filterList.map((filter) => <SearchFilterGroup filter={filter} key={filter.name} />)}
    </div>
  );
};

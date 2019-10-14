import React, { useContext, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { SearchFilterValueLeaf } from 'components/SearchFilterValueLeaf';
import { fetchList } from 'data/getResourceList';
import { CourseSearchParamsContext } from 'data/useCourseSearchParams';
import { useFilterValue } from 'data/useFilterValue';
import { requestStatus } from 'types/api';
import { FilterDefinition, FilterValue } from 'types/filters';
import { getMPTTChildrenPathMatcher } from 'utils/mptt';
import { Nullable } from 'utils/types';
import { useAsyncEffect } from 'utils/useAsyncEffect';

const messages = defineMessages({
  ariaHideChildren: {
    defaultMessage: 'Hide additional filters for {filterValueName}',
    description:
      'Accessibility message for the button to hide children of the current filter',
    id: 'components.SearchFilterValueParent.ariaHideChildren',
  },
  ariaShowChildren: {
    defaultMessage: 'Show more filters for {filterValueName}',
    description:
      'Accessibility message for the button to show children of the current filter',
    id: 'components.SearchFilterValueParent.ariaShowChildren',
  },
});

interface SearchFilterValueParentProps {
  filter: FilterDefinition;
  value: FilterValue;
}

export const SearchFilterValueParent = ({
  filter,
  value,
}: SearchFilterValueParentProps) => {
  const intl = useIntl();

  // Get the current values for the filter definition so we know if any children of this parent
  // filter are active (and we therefore need to get them and unfold the children).
  const [coursesSearchParams] = useContext(CourseSearchParamsContext);
  // Default to an array of strings no matter the current value so we can easily check for active values
  const activeFilterValues =
    coursesSearchParams[filter.name] || ([] as string[]);
  const activeValuesList =
    typeof activeFilterValues === 'string'
      ? [activeFilterValues]
      : activeFilterValues;

  // We can easily determine if any children are active without having to GET them first through our
  // path key convention.
  // If this parent filter has a key (path) `P-00040005`, all of its children will have with a matching
  // path such as `P-000400050001` or `L-000400050003`.
  const childrenPathMatch = getMPTTChildrenPathMatcher(value.key);
  const childrenPathMatchRegexp = new RegExp(childrenPathMatch);
  // Hide children by default, unless at least one of them is currently active
  const hasActiveChildren = activeValuesList.some(activeValueKey =>
    childrenPathMatchRegexp.test(activeValueKey),
  );
  const [userShowChildren, setUserShowChildren] = useState(null as Nullable<
    boolean
  >);
  const showChildren =
    userShowChildren !== null ? !!userShowChildren : hasActiveChildren;

  const [children, setChildren] = useState([] as FilterValue[]);
  useAsyncEffect(async () => {
    if (showChildren) {
      // Get only the filters & facet counts for the children of the current parent
      const childrenResponse = await fetchList('courses', {
        ...coursesSearchParams,
        [`${filter.name}_include`]: childrenPathMatch,
        scope: 'filters',
      });

      if (childrenResponse.status === requestStatus.FAILURE) {
        throw new Error(
          `Failed to get children filters for ${filter.name}/${childrenPathMatch}`,
        );
      }

      setChildren(childrenResponse.content.filters[filter.name].values);
    }
    // Be sure to include courseSearchParams in the dependencies so the children counts are re-fetched whenever
    // the user applies new filters or queries
  }, [showChildren, value, coursesSearchParams]);

  // We also need to know if the current filter is active itself and let the user toggle it directly
  const [isActive, toggle] = useFilterValue(filter, value);
  return (
    <div className="search-filter-value-parent">
      <div
        className={`search-filter-value-parent__self ${
          isActive ? 'active' : ''
        }`}
      >
        <label
          className={`search-filter-value-parent__self__label ${
            value.count === 0
              ? 'search-filter-value-parent__self__label--disabled'
              : ''
          }`}
        >
          <input
            checked={isActive}
            className="search-filter-value-parent__self__label__checkbox"
            disabled={value.count === 0}
            onChange={toggle}
            type="checkbox"
          />
          <div className="search-filter-value-parent__self__label__content">
            {value.human_name}&nbsp;
            {value.count || value.count === 0 ? `(${value.count})` : ''}
          </div>
        </label>
        <button
          aria-label={intl.formatMessage(
            showChildren
              ? messages.ariaHideChildren
              : messages.ariaShowChildren,
            {
              filterValueName: value.human_name,
            },
          )}
          aria-pressed={showChildren}
          className={`search-filter-value-parent__self__unfold ${showChildren &&
            'search-filter-value-parent__self__unfold--open'}`}
          onClick={() => setUserShowChildren(!showChildren)}
        >
          {showChildren ? '-' : '+'}
        </button>
      </div>
      {showChildren && (
        <div className="search-filter-value-parent__children">
          {children.map(childValue => (
            <SearchFilterValueLeaf
              filter={filter}
              key={childValue.key}
              value={childValue}
            />
          ))}
        </div>
      )}
    </div>
  );
};

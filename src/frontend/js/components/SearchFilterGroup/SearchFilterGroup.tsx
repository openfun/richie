import differenceBy from 'lodash-es/differenceBy';
import * as React from 'react';
import { FormattedMessage } from 'react-intl';

import { FilterDefinitionWithValues, FilterValue } from '../../types/filters';
import { SearchFilter } from '../SearchFilter/SearchFilter';

export interface SearchFilterGroupProps {
  activeFilterValues: FilterValue[];
  addFilter: (filterKey: string) => void;
  filter: FilterDefinitionWithValues;
  removeFilter: (filterKey: string) => void;
}

export const SearchFilterGroup = (props: SearchFilterGroupProps) => {
  const { humanName, values } = props.filter;

  return (
    <div className="search-filter-group">
      <h3 className="search-filter-group__title">
        <FormattedMessage {...humanName} />
      </h3>
      <div className="search-filter-group__list">
        {/* First we render the active filter values */}
        {props.activeFilterValues.map(value => (
          <SearchFilter
            addFilter={props.addFilter}
            filter={value}
            isActive={true}
            key={value.primaryKey}
            removeFilter={props.removeFilter}
          />
        ))}
        {/* Then we render the default list of facets, minus any active values that might have been in the facets */}
        {differenceBy(values, props.activeFilterValues, 'primaryKey').map(
          value => (
            <SearchFilter
              addFilter={props.addFilter}
              filter={value}
              isActive={false}
              key={value.primaryKey}
              removeFilter={props.removeFilter}
            />
          ),
        )}
      </div>
    </div>
  );
};

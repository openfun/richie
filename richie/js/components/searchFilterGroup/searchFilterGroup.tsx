import includes from 'lodash-es/includes';
import isArray from 'lodash-es/isArray';
import sortBy from 'lodash-es/sortBy';
import * as React from 'react';

import { FilterDefinition, FilterValue } from '../../types/FilterDefinition';
import { Maybe, Nullable } from '../../utils/types';
import SearchFilter from '../searchFilter/searchFilter';

export interface SearchFilterGroupProps {
  addFilter: (filterKey: string) => void;
  currentValue: Maybe<string | number | Array<string | number>>;
  filter: FilterDefinition;
  removeFilter: (filterKey: string) => void;
}

export const SearchFilterGroup = (props: SearchFilterGroupProps) => {
  const { humanName, values } = props.filter;
  // Select currently active filter values (eg. for a given value, if we're filtering on
  // that dimension by that value).
  // We'll need to do at least two lookups for each active prop during each render,
  // which is why we build a hash table for simple/inexpensive lookups below.
  const valueStates: { [key: string]: boolean } = values.reduce(
    (acc, fv: FilterValue) =>
      props.currentValue &&
      (props.currentValue === fv.primaryKey ||
        (isArray(props.currentValue) &&
          includes(props.currentValue, fv.primaryKey)))
        ? // Key is active
          { ...acc, [fv.primaryKey]: true }
        : // Key is inactive
          { ...acc, [fv.primaryKey]: false },
    {},
  );

  return (
    <div className="search-filter-group">
      <h3 className="search-filter-group__title">{humanName}</h3>
      <div className="search-filter-group__list">
        {sortBy(values, val => (valueStates[val.primaryKey] ? 0 : 1)).map(
          value => (
            <SearchFilter
              addFilter={props.addFilter}
              filter={value}
              isActive={valueStates[value.primaryKey]}
              key={value.primaryKey}
              removeFilter={props.removeFilter}
            />
          ),
        )}
      </div>
    </div>
  );
};

export default SearchFilterGroup;

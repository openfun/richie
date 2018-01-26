import * as React from "react";

import { FilterDefinition } from '../../types/FilterDefinition';

interface SearchFilterGroupState {}

export interface SearchFilterGroupProps {
  filter: FilterDefinition;
}

export class SearchFilterGroup extends React.Component<SearchFilterGroupProps, SearchFilterGroupState> {
  render () {
    const { human_name, values } = this.props.filter;

    return <div className="search-filter-group">
      <h3 className="search-filter-group__title">{human_name}</h3>
      <div className="search-filter-group__list">
        {values.map(value =>
          <button className="search-filter-group__list__value">
            {value[1]}
            <span className="search-filter-group__list__value__count">358</span>
          </button>
        )}
      </div>
    </div>    
  }
}
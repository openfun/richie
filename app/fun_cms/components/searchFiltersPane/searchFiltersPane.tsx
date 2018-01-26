import * as React from "react";

import { FilterDefinition } from '../../types/FilterDefinition';
import { SearchFilterGroup } from '../searchFilterGroup/searchFilterGroup';
import organizationsResp from '../../fixtures_js/organizations';
import subjectsResp from '../../fixtures_js/subjects';

interface SearchFiltersPaneState {
  filters: Array<FilterDefinition>,
}

export interface SearchFiltersPaneProps {}

export class SearchFiltersPane extends React.Component<SearchFiltersPaneProps, SearchFiltersPaneState> {
  constructor (props: SearchFiltersPaneProps) {
    super(props);

    const newFilter: FilterDefinition = {
      human_name: 'New courses',
      machine_name: 'status',
      values: [
        [ 'new', 'First session' ],
      ],
    };

    const statusFilter: FilterDefinition = {
      human_name: 'Availability',
      machine_name: 'availability',
      values: [
        [ 'coming_soon', 'Coming soon' ],
        [ 'current', 'Current session' ],
        [ 'open', 'Open, no session' ]
      ],
    };

    const subjectsFilter: FilterDefinition = {
      human_name: 'subjects',
      machine_name: 'Subjects',
      values: subjectsResp.results.map((subject) => {
        return [ subject.code, subject.name ];
      }),
    };

    const organizationsFilter: FilterDefinition = {
      human_name: 'Organization',
      machine_name: 'organization',
      values: organizationsResp.results.map((organization) => {
        return [ organization.code, organization.name ];
      }),
    };
    
    const languagesFilter: FilterDefinition = {
      human_name: 'Language',
      machine_name: 'language',
      values: [
        [ 'en', 'English' ],
        [ 'fr', 'French' ],
      ],
    };
    
    this.state = {
      filters: [
        newFilter,
        statusFilter,
        subjectsFilter,
        organizationsFilter,
        languagesFilter,
      ],
    };
  }

  render () {
    const { filters } = this.state;
    
    return <div className="search-filters-pane">
      <h2 className="search-filters-pane__title">Filter results</h2>
      {filters.map(filter =>
        <SearchFilterGroup filter={filter} />
      )}
    </div>    
  }
}
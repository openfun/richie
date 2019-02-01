import * as React from 'react';

import { ResourceListGet } from '../../data/genericSideEffects/getResourceList/actions';
import { Course } from '../../types/Course';
import { CourseGlimpseListContainer } from '../CourseGlimpseListContainer/CourseGlimpseListContainer';
import { SearchFiltersPane } from '../SearchFiltersPane/SearchFiltersPane';
import { SearchSuggestFieldContainer } from '../SearchSuggestFieldContainer/SearchSuggestFieldContainer';

export interface SearchProps {
  requestOrganizations: () => ResourceListGet;
  requestCategories: () => ResourceListGet;
}

interface SearchState {
  courses: Course[];
}

export class Search extends React.Component<SearchProps, SearchState> {
  componentWillMount() {
    this.props.requestOrganizations();
    this.props.requestCategories();
  }

  render() {
    return (
      <div className="search">
        <div className="search__filters">
          <SearchFiltersPane />
        </div>
        <div className="search__results">
          <SearchSuggestFieldContainer />
          <CourseGlimpseListContainer />
        </div>
      </div>
    );
  }
}

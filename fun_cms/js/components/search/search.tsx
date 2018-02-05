import * as React from 'react';

import CourseGlimpseList from '../courseGlimpseList/courseGlimpseList';
import SearchFiltersPane from '../searchFiltersPane/searchFiltersPane';
import courses from '../../fixtures/courses';
import Course from '../../types/Course';

interface SearchState {
  courses: Course[];
}

export interface SearchProps {}

export class Search extends React.Component<SearchProps, SearchState> {
  constructor (props: SearchProps) {
    super(props);

    this.state = {
      courses: courses.results,
    };
  }

  render() {
    const { courses } = this.state;
    return <div className="search">
      <div className="search__filters">
        <SearchFiltersPane />
      </div>
      <div className="search__results">
        <CourseGlimpseList courses={courses} />
      </div>
    </div>;
  }
}

export default Search;

import * as React from 'react';

import Course from '../../types/Course';
import CourseGlimpseListContainer from '../courseGlimpseListContainer/courseGlimpseListContainer';
import SearchFiltersPane from '../searchFiltersPane/searchFiltersPane';

interface SearchState {
  courses: Course[];
}

export const Search = () => {
  return <div className="search">
    <div className="search__filters">
      <SearchFiltersPane />
    </div>
    <div className="search__results">
      <CourseGlimpseListContainer />
    </div>
  </div>;
};

export default Search;

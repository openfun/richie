import * as React from 'react';

import courses from '../../fixtures/courses';
import Course from '../../types/Course';
import CourseGlimpseList from '../courseGlimpseList/courseGlimpseList';
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
      /* TODO: Remove any when we stop using fixtures to display courses */
      <CourseGlimpseList courses={courses.results as any} />
    </div>
  </div>;
};

export default Search;

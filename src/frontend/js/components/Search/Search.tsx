import React from 'react';

import { useCourseSearch } from '../../data/useCourseSearch/useCourseSearch';
import {
  CourseSearchParamsContext,
  useCourseSearchParams,
} from '../../data/useCourseSearchParams/useCourseSearchParams';
import { requestStatus } from '../../types/api';
import { CourseGlimpseList } from '../CourseGlimpseList/CourseGlimpseList';
import { SearchFiltersPane } from '../SearchFiltersPane/SearchFiltersPane';
import { SearchLoader } from '../SearchLoader/SearchLoader';
import { SearchSuggestField } from '../SearchSuggestField/SearchSuggestField';

export const Search = () => {
  const [courseSearchParams, setCourseSearchParams] = useCourseSearchParams();
  const courseSearchResponse = useCourseSearch(courseSearchParams);

  return (
    <div className="search">
      <CourseSearchParamsContext.Provider
        value={[courseSearchParams, setCourseSearchParams]}
      >
        <div className="search__filters">
          <SearchFiltersPane
            filters={
              courseSearchResponse &&
              courseSearchResponse.status === requestStatus.SUCCESS
                ? courseSearchResponse.content.filters
                : null
            }
          />
        </div>
        {courseSearchResponse &&
        courseSearchResponse.status === requestStatus.SUCCESS ? (
          <div className="search__results">
            <SearchSuggestField
              filters={courseSearchResponse.content.filters}
            />
            <CourseGlimpseList
              courses={courseSearchResponse.content.objects}
              meta={courseSearchResponse.content.meta}
            />{' '}
          </div>
        ) : (
          <SearchLoader />
        )}
      </CourseSearchParamsContext.Provider>
    </div>
  );
};

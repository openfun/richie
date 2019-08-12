import React from 'react';

import { useCourseSearch } from '../../data/useCourseSearch/useCourseSearch';
import {
  CourseSearchParamsContext,
  useCourseSearchParams,
} from '../../data/useCourseSearchParams/useCourseSearchParams';
import { requestStatus } from '../../types/api';
import { CourseGlimpseList } from '../CourseGlimpseList/CourseGlimpseList';
import { PaginateCourseSearch } from '../PaginateCourseSearch';
import { SearchFiltersPane } from '../SearchFiltersPane/SearchFiltersPane';
import { SearchLoader } from '../SearchLoader/SearchLoader';
import { SearchSuggestField } from '../SearchSuggestField/SearchSuggestField';

interface SearchProps {
  pageTitle?: string;
}

export const Search = ({ pageTitle }: SearchProps) => {
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
        <div className="search__results">
          {pageTitle && <h1 className="search__results__title">{pageTitle}</h1>}
          {courseSearchResponse &&
          courseSearchResponse.status === requestStatus.SUCCESS ? (
            <React.Fragment>
              <SearchSuggestField
                filters={courseSearchResponse.content.filters}
              />
              <CourseGlimpseList
                courses={courseSearchResponse.content.objects}
                meta={courseSearchResponse.content.meta}
              />
              <PaginateCourseSearch
                courseSearchTotalCount={
                  courseSearchResponse.content.meta.total_count
                }
              />
            </React.Fragment>
          ) : (
            <SearchLoader />
          )}
        </div>
      </CourseSearchParamsContext.Provider>
    </div>
  );
};

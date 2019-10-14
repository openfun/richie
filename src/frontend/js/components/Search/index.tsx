import React, { useState } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';

import { CourseGlimpseList } from 'components/CourseGlimpseList';
import { PaginateCourseSearch } from 'components/PaginateCourseSearch';
import { SearchFiltersPane } from 'components/SearchFiltersPane';
import { SearchLoader } from 'components/SearchLoader';
import { SearchSuggestField } from 'components/SearchSuggestField';
import { useCourseSearch } from 'data/useCourseSearch';
import {
  CourseSearchParamsContext,
  useCourseSearchParams,
} from 'data/useCourseSearchParams';
import { requestStatus } from 'types/api';
import { CommonDataProps } from 'types/commonDataProps';
import { matchMedia } from 'utils/indirection/window';

const messages = defineMessages({
  hideFiltersPane: {
    defaultMessage: 'Hide filters pane',
    description:
      'Accessibility text for the button/icon that toggles *off* the filters pane on mobile',
    id: 'components.Search.hideFiltersPane',
  },
  showFiltersPane: {
    defaultMessage: 'Show filters pane',
    description:
      'Accessibility text for the button/icon that toggles *on* the filters pane on mobile',
    id: 'components.Search.showFiltersPane',
  },
});

interface SearchProps {
  pageTitle?: string;
}

export const Search = ({
  context,
  pageTitle,
}: SearchProps & CommonDataProps) => {
  const [courseSearchParams, setCourseSearchParams] = useCourseSearchParams();
  const courseSearchResponse = useCourseSearch(courseSearchParams);

  const alwaysShowFilters = matchMedia('(min-width: 992px)').matches;
  const [showFilters, setShowFilters] = useState(false);

  const [referenceId] = useState(`control-${Math.random()}`);

  return (
    <div className="search">
      <CourseSearchParamsContext.Provider
        value={[courseSearchParams, setCourseSearchParams]}
      >
        <div
          className={`search__filters ${
            !alwaysShowFilters && showFilters ? 'search__filters--active' : ''
          }`}
        >
          <SearchFiltersPane
            aria-hidden={alwaysShowFilters ? false : !showFilters}
            filters={
              courseSearchResponse &&
              courseSearchResponse.status === requestStatus.SUCCESS
                ? courseSearchResponse.content.filters
                : null
            }
            id={referenceId}
          />
          {!alwaysShowFilters && (
            <button
              aria-expanded={showFilters}
              aria-controls={referenceId}
              className={'search__filters__toggle'}
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? (
                <React.Fragment>
                  <svg
                    aria-hidden={true}
                    role="img"
                    className="icon search__filters__toggle__icon"
                  >
                    <use xlinkHref={`${context.assets.icons}#icon-cross`} />
                  </svg>{' '}
                  <span className="offscreen">
                    <FormattedMessage {...messages.hideFiltersPane} />
                  </span>
                </React.Fragment>
              ) : (
                <React.Fragment>
                  <svg
                    aria-hidden={true}
                    role="img"
                    className="icon search__filters__toggle__icon"
                  >
                    <use xlinkHref={`${context.assets.icons}#icon-filter`} />
                  </svg>
                  <span className="offscreen">
                    <FormattedMessage {...messages.showFiltersPane} />
                  </span>
                </React.Fragment>
              )}
            </button>
          )}
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
          {!alwaysShowFilters && (
            <div
              aria-hidden={true}
              className={`search__results__overlay ${
                showFilters ? 'search__results__overlay--visible' : ''
              }`}
              onClick={() => setShowFilters(false)}
            />
          )}
        </div>
      </CourseSearchParamsContext.Provider>
    </div>
  );
};

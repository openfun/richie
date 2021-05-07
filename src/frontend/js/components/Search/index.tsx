import React, { useState, useEffect } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';

import { CourseGlimpseList } from 'components/CourseGlimpseList';
import { PaginateCourseSearch } from 'components/PaginateCourseSearch';
import { SearchFiltersPane } from 'components/SearchFiltersPane';
import { Spinner } from 'components/Spinner';
import { useCourseSearch } from 'data/useCourseSearch';
import { useCourseSearchParams, CourseSearchParamsAction } from 'data/useCourseSearchParams';
import useMatchMedia from 'utils/useMatchMedia';
import { RequestStatus } from 'types/api';
import { CommonDataProps } from 'types/commonDataProps';
import { scroll } from 'utils/indirection/window';

const messages = defineMessages({
  errorMessage: {
    defaultMessage: `Something's wrong! Courses could not be loaded.`,
    description: 'Error message for Search view when the request to load courses fails',
    id: 'components.Search.errorMessage',
  },
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
  spinnerText: {
    defaultMessage: 'Loading search results...',
    description: 'Accessibility text for the spinner while search results are being loaded',
    id: 'components.Search.spinnerText',
  },
});

const Search = ({ context }: CommonDataProps) => {
  const { courseSearchParams, lastDispatchActions } = useCourseSearchParams();
  const { data: courseSearchResponse } = useCourseSearch(courseSearchParams);

  const alwaysShowFilters = useMatchMedia('(min-width: 992px)');
  const [showFilters, setShowFilters] = useState(false);

  const [referenceId] = useState(`control-${Math.random()}`);

  useEffect(() => {
    // We want to scroll back to the top when courses have changed, unless the last action resulted
    // from a user interaction with the SuggestField, eg. changed the query
    if (
      lastDispatchActions &&
      lastDispatchActions?.every((action) => action.type !== CourseSearchParamsAction.queryUpdate)
    ) {
      scroll({
        behavior: 'smooth',
        top: 0,
      });
    }
  }, [courseSearchResponse]);

  return (
    <div className="search">
      <div
        className={`search__filters ${
          !alwaysShowFilters && showFilters ? 'search__filters--active' : ''
        }`}
      >
        <SearchFiltersPane
          aria-hidden={alwaysShowFilters ? false : !showFilters}
          filters={
            courseSearchResponse?.status === RequestStatus.SUCCESS
              ? courseSearchResponse.content.filters
              : null
          }
          id={referenceId}
        />
        {!alwaysShowFilters && (
          <button
            aria-expanded={showFilters}
            aria-controls={referenceId}
            className="search__filters__toggle"
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? (
              <React.Fragment>
                <svg aria-hidden={true} role="img" className="icon search__filters__toggle__icon">
                  <use xlinkHref="#icon-cross" />
                </svg>{' '}
                <span className="offscreen">
                  <FormattedMessage {...messages.hideFiltersPane} />
                </span>
              </React.Fragment>
            ) : (
              <React.Fragment>
                <svg aria-hidden={true} role="img" className="icon search__filters__toggle__icon">
                  <use xlinkHref="#icon-filter" />
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
        {courseSearchResponse && courseSearchResponse.status === RequestStatus.SUCCESS ? (
          <React.Fragment>
            <CourseGlimpseList
              context={context}
              courses={courseSearchResponse.content.objects}
              meta={courseSearchResponse.content.meta}
            />
            <PaginateCourseSearch
              courseSearchTotalCount={courseSearchResponse.content.meta.total_count}
            />
          </React.Fragment>
        ) : courseSearchResponse && courseSearchResponse.status === RequestStatus.FAILURE ? (
          <div className="search__results__error">
            <svg aria-hidden={true} role="img">
              <use xlinkHref="#icon-search-fail" />
            </svg>
            <p>
              <FormattedMessage {...messages.errorMessage} />
            </p>
          </div>
        ) : (
          <Spinner size="large">
            <FormattedMessage {...messages.spinnerText} />
          </Spinner>
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
    </div>
  );
};

export default Search;

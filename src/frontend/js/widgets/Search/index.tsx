import { Fragment, useState, useEffect, useRef } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';

import { Spinner } from 'components/Spinner';
import { useCourseSearchParams, CourseSearchParamsAction } from 'hooks/useCourseSearchParams';
import useMatchMedia from 'hooks/useMatchMedia';
import { CommonDataProps } from 'types/commonDataProps';
import { scroll } from 'utils/indirection/window';
import { CourseGlimpseList, getCourseGlimpseListProps } from 'components/CourseGlimpseList';
import { PaginateCourseSearch } from './components/PaginateCourseSearch';
import { SearchFiltersPane } from './components/SearchFiltersPane';
import { useCourseSearch } from './hooks/useCourseSearch';
import { RequestStatus } from './types/api';
import FiltersPaneCloseButton from './components/FiltersPaneCloseButton';

const messages = defineMessages({
  errorMessage: {
    defaultMessage: `Something's wrong! Courses could not be loaded.`,
    description: 'Error message for Search view when the request to load courses fails',
    id: 'components.Search.errorMessage',
  },
  resultsTitle: {
    defaultMessage: 'Search results',
    description:
      'Title for the search results pane in course search (not shown, made for screen reader users).',
    id: 'components.Search.resultsTitle',
  },
  spinnerText: {
    defaultMessage: 'Loading search results...',
    description: 'Accessibility text for the spinner while search results are being loaded',
    id: 'components.Search.spinnerText',
  },
  textQueryLengthWarning: {
    defaultMessage: `Text search requires at least 3 characters. { query } is not long enough to search.
Search results will not be affected by this query.`,
    description:
      'Warning message in search results when the text query is not long enough to be used.',
    id: 'components.Search.textQueryLengthWarning',
  },
});

const Search = ({ context }: CommonDataProps) => {
  const { courseSearchParams, lastDispatchActions } = useCourseSearchParams();
  const { query, ...courseSearchParamsWithoutQuery } = courseSearchParams;

  const { data: courseSearchResponse } = useCourseSearch(
    query && query.length < 3 ? courseSearchParamsWithoutQuery : courseSearchParams,
  );

  const alwaysShowFilters = useMatchMedia('(min-width: 992px)');
  const [showFilters, setShowFilters] = useState(false);
  const filtersPaneRef = useRef<HTMLDivElement>(null);
  const [referenceId] = useState(`control-${Math.random()}`);
  // this helps generating a class after the .search__filters css transition ended
  const [filtersPaneClosing, setFiltersPaneClosing] = useState(false);
  const onFiltersPaneCloseButtonClick = () => {
    if (showFilters) {
      setFiltersPaneClosing(showFilters);
    }
    setShowFilters(!showFilters);
  };

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

  useEffect(() => {
    if (filtersPaneClosing) {
      filtersPaneRef.current?.addEventListener(
        'transitionend',
        () => setFiltersPaneClosing(false),
        { once: true },
      );
    }
  }, [filtersPaneClosing]);

  return (
    <div className="search">
      <div
        role="region"
        aria-labelledby={`${referenceId}-filters__title`}
        ref={filtersPaneRef}
        className={`search__filters ${
          !alwaysShowFilters && showFilters ? 'search__filters--active' : ''
        }`}
      >
        {!alwaysShowFilters && (
          <FiltersPaneCloseButton
            expanded={showFilters}
            controls={`${referenceId}-filters`}
            onClick={onFiltersPaneCloseButtonClick}
          />
        )}
        <div
          className={`search__filters__pane-container ${filtersPaneClosing ? 'is-closing' : ''} ${
            !alwaysShowFilters && !showFilters && !filtersPaneClosing ? 'is-closed' : ''
          }`}
        >
          <SearchFiltersPane
            filters={
              courseSearchResponse?.status === RequestStatus.SUCCESS
                ? courseSearchResponse.content.filters
                : null
            }
            id={`${referenceId}-filters`}
          />
        </div>
        {/* we repeat the close button at the end because there can be quite a lot of filters,
        and going back to the close button at the top is cumbersome, especially for screen reader users */}
        {!alwaysShowFilters && showFilters && (
          <FiltersPaneCloseButton
            expanded={showFilters}
            controls={`${referenceId}-filters`}
            onClick={onFiltersPaneCloseButtonClick}
            type="bottom"
          />
        )}
      </div>
      <div
        className="search__results"
        role="region"
        aria-labelledby={`${referenceId}-results__title`}
      >
        <h2 className="offscreen" id={`${referenceId}-results__title`}>
          <FormattedMessage {...messages.resultsTitle} />
        </h2>
        {courseSearchResponse && courseSearchResponse.status === RequestStatus.SUCCESS ? (
          <Fragment>
            {query && query.length < 3 ? (
              <div className="banner banner--rounded banner--warning">
                <p className="banner__message">
                  <FormattedMessage
                    {...messages.textQueryLengthWarning}
                    values={{ query: <b>&quot;{query}&quot;</b> }}
                  />
                </p>
              </div>
            ) : null}
            <CourseGlimpseList
              context={context}
              courses={getCourseGlimpseListProps(courseSearchResponse.content.objects)}
              meta={courseSearchResponse.content.meta}
            />
            <PaginateCourseSearch
              courseSearchTotalCount={courseSearchResponse.content.meta.total_count}
            />
          </Fragment>
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
            onClick={onFiltersPaneCloseButtonClick}
          />
        )}
      </div>
    </div>
  );
};

export default Search;

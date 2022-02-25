import { Fragment, useState, useEffect } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';

import { CourseGlimpseList } from 'components/CourseGlimpseList';
import { PaginateCourseSearch } from 'components/PaginateCourseSearch';
import { SearchFiltersPane } from 'components/SearchFiltersPane';
import { Spinner } from 'components/Spinner';
import { Icon } from 'components/Icon';
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
              <Fragment>
                <Icon name="icon-cross" className="search__filters__toggle__icon" />{' '}
                <span className="offscreen">
                  <FormattedMessage {...messages.hideFiltersPane} />
                </span>
              </Fragment>
            ) : (
              <Fragment>
                <Icon name="icon-filter" className="search__filters__toggle__icon" />
                <span className="offscreen">
                  <FormattedMessage {...messages.showFiltersPane} />
                </span>
              </Fragment>
            )}
          </button>
        )}
      </div>
      <div className="search__results">
        <h2 className="offscreen">
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
              courses={courseSearchResponse.content.objects}
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
            onClick={() => setShowFilters(false)}
          />
        )}
      </div>
    </div>
  );
};

export default Search;

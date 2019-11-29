import React, { useState } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';

import { CourseGlimpseList } from 'components/CourseGlimpseList';
import { PaginateCourseSearch } from 'components/PaginateCourseSearch';
import { SearchFiltersPane } from 'components/SearchFiltersPane';
import { Spinner } from 'components/Spinner';
import { useCourseSearch } from 'data/useCourseSearch';
import { useCourseSearchParams } from 'data/useCourseSearchParams';
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
  spinnerText: {
    defaultMessage: 'Loading search results...',
    description:
      'Accessibility text for the spinner while search results are being loaded',
    id: 'components.Search.spinnerText',
  },
});

export const Search = ({ context }: CommonDataProps) => {
  const [courseSearchParams] = useCourseSearchParams();
  const courseSearchResponse = useCourseSearch(courseSearchParams);

  const alwaysShowFilters = matchMedia('(min-width: 992px)').matches;
  const [showFilters, setShowFilters] = useState(false);

  const [referenceId] = useState(`control-${Math.random()}`);

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
        {courseSearchResponse &&
        courseSearchResponse.status === requestStatus.SUCCESS ? (
          <React.Fragment>
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

import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { useRef } from 'react';
import { Button } from '@openfun/cunningham-react';
import classNames from 'classnames';
import { isCredentialOrder, isEnrollment } from 'pages/DashboardCourses/useOrdersEnrollments';
import { Spinner } from 'components/Spinner';
import { DashboardItemEnrollment } from 'widgets/Dashboard/components/DashboardItem/Enrollment/DashboardItemEnrollment';
import { DashboardItemOrder } from 'widgets/Dashboard/components/DashboardItem/Order/DashboardItemOrder';
import Banner, { BannerType } from 'components/Banner';
import { useIntersectionObserver } from 'hooks/useIntersectionObserver';
import SearchBar from 'widgets/Dashboard/components/SearchBar';
import SearchResultsCount from 'widgets/Dashboard/components/SearchResultsCount';
import useLearnerCoursesSearch from 'hooks/useLearnerCoursesSearch';

const messages = defineMessages({
  loading: {
    defaultMessage: 'Loading orders and enrollments...',
    description: 'Message displayed while loading orders and enrollments',
    id: 'components.DashboardCourses.loading',
  },
  loadMore: {
    defaultMessage: 'Load more',
    description: 'Button to manually load more orders and enrollments',
    id: 'components.DashboardCourses.loadMoreResults',
  },
  emptyList: {
    id: 'components.DashboardCourses.emptyList',
    description: "Empty placeholder of the dashboard's list of orders and enrollments",
    defaultMessage: 'You have no enrollments nor orders yet.',
  },
});

export const DashboardCourses = () => {
  const intl = useIntl();
  const { data, isLoadingMore, isNewSearchLoading, next, hasMore, submitSearch, count, error } =
    useLearnerCoursesSearch();
  const loadMoreButtonRef = useRef<HTMLButtonElement & HTMLAnchorElement>(null);
  useIntersectionObserver({
    target: loadMoreButtonRef,
    onIntersect: next,
    enabled: hasMore,
  });

  return (
    <div className="dashboard__courses">
      {error ? (
        <Banner message={error} type={BannerType.ERROR} />
      ) : (
        <>
          <SearchBar.Container>
            <SearchBar onSubmit={submitSearch} />
            <SearchResultsCount nbResults={count} />
          </SearchBar.Container>

          <div
            className={classNames('dashboard__courses__list', {
              'dashboard-course-list--fade': isNewSearchLoading,
            })}
          >
            {data.map((datum) => (
              <div
                key={datum.id}
                className="dashboard__courses__list__item"
                data-testid="order-enrollment-list-item"
              >
                {isEnrollment(datum) && <DashboardItemEnrollment enrollment={datum} />}
                {isCredentialOrder(datum) && <DashboardItemOrder order={datum} />}
              </div>
            ))}
          </div>

          {(isNewSearchLoading && data.length === 0) || isLoadingMore ? (
            <Spinner aria-labelledby="loading-courses-data">
              <span id="loading-courses-data">
                <FormattedMessage {...messages.loading} />
              </span>
            </Spinner>
          ) : (
            data.length === 0 && (
              <div className="dashboard__courses__empty">
                <Banner message={intl.formatMessage(messages.emptyList)} />
              </div>
            )
          )}

          {hasMore && (
            <Button
              onClick={() => next()}
              disabled={isLoadingMore}
              ref={loadMoreButtonRef}
              color="tertiary"
            >
              <FormattedMessage {...messages.loadMore} />
            </Button>
          )}
        </>
      )}
    </div>
  );
};

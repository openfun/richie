import { defineMessages, FormattedMessage } from 'react-intl';
import { useRef } from 'react';
import { Button } from '@openfun/cunningham-react';
import {
  useOrdersEnrollments,
  isEnrollement,
  isOrder,
} from 'pages/DashboardCourses/useOrdersEnrollments';
import { Spinner } from 'components/Spinner';
import { DashboardItemEnrollment } from 'widgets/Dashboard/components/DashboardItem/Enrollment/DashboardItemEnrollment';
import { DashboardItemOrder } from 'widgets/Dashboard/components/DashboardItem/Order/DashboardItemOrder';
import Banner, { BannerType } from 'components/Banner';
import { useIntersectionObserver } from 'hooks/useIntersectionObserver';

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
  const { next, data, hasMore, error, isLoading, count } = useOrdersEnrollments();

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
          {count === 0 && (
            <p className="dashboard__courses__empty">
              <FormattedMessage {...messages.emptyList} />
            </p>
          )}
          <div className="dashboard__courses__list">
            {data.map((datum) => (
              <div
                key={datum.id}
                className="dashboard__courses__list__item"
                data-testid="order-enrollment-list-item"
              >
                {isEnrollement(datum) && <DashboardItemEnrollment enrollment={datum} />}
                {isOrder(datum) && <DashboardItemOrder order={datum} />}
              </div>
            ))}
          </div>
          {isLoading && (
            <Spinner aria-labelledby="loading-orders-enrollments">
              <span id="loading-orders-enrollments">
                <FormattedMessage {...messages.loading} />
              </span>
            </Spinner>
          )}
          {hasMore && (
            <Button
              onClick={() => next()}
              disabled={isLoading}
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

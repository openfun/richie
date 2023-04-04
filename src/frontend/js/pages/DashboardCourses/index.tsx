import { defineMessages, FormattedMessage } from 'react-intl';
import { useRef } from 'react';
import { Enrollment, Order } from 'types/Joanie';
import { Spinner } from 'components/Spinner';
import { DashboardItemEnrollment } from 'widgets/Dashboard/components/DashboardItem/Enrollment/DashboardItemEnrollment';
import { DashboardItemOrder } from 'widgets/Dashboard/components/DashboardItem/Order/DashboardItemOrder';
import { useOrdersEnrollments } from 'pages/DashboardCourses/useOrdersEnrollments';
import Banner, { BannerType } from 'components/Banner';
import { useIntersectionObserver } from 'hooks/useIntersectionObserver';
import { Button } from 'components/Button';

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
              <div key={datum.item.id} className="dashboard__courses__list__item">
                {datum.type === 'enrollment' && (
                  <DashboardItemEnrollment enrollment={datum.item as Enrollment} />
                )}
                {datum.type === 'order' && <DashboardItemOrder order={datum.item as Order} />}
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
              className="dashboard__courses__list__more-results"
              onClick={() => next()}
              disabled={isLoading}
              ref={loadMoreButtonRef}
              color="transparent-darkest"
            >
              <FormattedMessage {...messages.loadMore} />
            </Button>
          )}
        </>
      )}
    </div>
  );
};

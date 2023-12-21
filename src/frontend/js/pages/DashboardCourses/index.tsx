import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { useRef } from 'react';
import { Button } from '@openfun/cunningham-react';
import {
  isCredentialOrder,
  isEnrollment,
  useOrdersEnrollments,
} from 'pages/DashboardCourses/useOrdersEnrollments';
import { Spinner } from 'components/Spinner';
import { DashboardItemEnrollment } from 'widgets/Dashboard/components/DashboardItem/Enrollment/DashboardItemEnrollment';
import { DashboardItemOrder } from 'widgets/Dashboard/components/DashboardItem/Order/DashboardItemOrder';
import Banner, { BannerType } from 'components/Banner';
import { useIntersectionObserver } from 'hooks/useIntersectionObserver';
import { OrderState, ProductType } from 'types/Joanie';

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
  const { next, data, hasMore, error, isLoading, count } = useOrdersEnrollments({
    orderFilters: { product_type: [ProductType.CREDENTIAL], state_exclude: [OrderState.CANCELED] },
  });

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
            <div className="dashboard__courses__empty">
              <Banner message={intl.formatMessage(messages.emptyList)} />
            </div>
          )}
          <div className="dashboard__courses__list">
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

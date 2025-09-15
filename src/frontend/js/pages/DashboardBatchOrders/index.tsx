import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import classNames from 'classnames';
import { Spinner } from 'components/Spinner';
import { useBatchOrders } from 'hooks/useBatchOrder/useBatchOrder';
import { DashboardItemBatchOrder } from 'widgets/Dashboard/components/DashboardItem/BatchOrder';
import Banner, { BannerType } from 'components/Banner';
import { usePagination, Pagination } from 'components/Pagination';
import { useEffect } from 'react';

const messages = defineMessages({
  loading: {
    defaultMessage: 'Loading orders and enrollments...',
    description: 'Message displayed while loading orders and enrollments',
    id: 'components.DashboardBatchOrders.loading',
  },
  emptyList: {
    id: 'components.DashboardBatchOrders.emptyList',
    description: "Empty placeholder of the dashboard's list of orders and enrollments",
    defaultMessage: 'You have no batch orders yet.',
  },
});

export const DashboardBatchOrders = () => {
  const intl = useIntl();
  const pagination = usePagination({ itemsPerPage: 10 });

  const { items, meta, states } = useBatchOrders({
    page: pagination.currentPage,
    page_size: pagination.itemsPerPage,
  });

  useEffect(() => {
    if (meta?.pagination?.count) {
      pagination.setItemsCount(meta.pagination.count);
    }
  }, [meta?.pagination?.count]);

  if (states.error) {
    return <Banner message={states.error} type={BannerType.ERROR} />;
  }

  if (items?.length && states?.isPending) {
    return (
      <Spinner aria-labelledby="loading-courses-data">
        <span id="loading-courses-data">
          <FormattedMessage {...messages.loading} />
        </span>
      </Spinner>
    );
  }

  return (
    <div className="dashboard__courses">
      {items?.length === 0 && (
        <div className="dashboard__courses__empty">
          <Banner message={intl.formatMessage(messages.emptyList)} />
        </div>
      )}
      {items?.length > 0 && (
        <>
          <div
            className={classNames('dashboard__courses__list', {
              'dashboard__list--loading': states?.isPending,
            })}
          >
            {items?.map((batchOrder) => (
              <div
                key={batchOrder.id}
                className="dashboard__courses__list__item"
                data-testid="order-enrollment-list-item"
              >
                <DashboardItemBatchOrder batchOrder={batchOrder} />
              </div>
            ))}
          </div>
          <Pagination {...pagination} />
        </>
      )}
    </div>
  );
};

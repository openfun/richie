import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import classNames from 'classnames';
import { Spinner } from 'components/Spinner';
import { useBatchOrder } from 'hooks/useBatchOrder/useBatchOrder';
import { DashboardItemBatchOrder } from 'widgets/Dashboard/components/DashboardItem/BatchOrder';
import { BatchOrderRead, PaginatedResponse } from 'types/Joanie';
import Banner from 'components/Banner';

const messages = defineMessages({
  loading: {
    defaultMessage: 'Loading orders and enrollments...',
    description: 'Message displayed while loading orders and enrollments',
    id: 'components.DashboardBatchOrders.loading',
  },
  loadMore: {
    defaultMessage: 'Load more',
    description: 'Button to manually load more orders and enrollments',
    id: 'components.DashboardBatchOrders.loadMoreResults',
  },
  emptyList: {
    id: 'components.DashboardBatchOrders.emptyList',
    description: "Empty placeholder of the dashboard's list of orders and enrollments",
    defaultMessage: 'You have no batch orders yet.',
  },
});

export const DashboardBatchOrders = () => {
  const intl = useIntl();
  const { methods } = useBatchOrder();
  const { data, isLoading } = methods.get();
  const batchOrders = (data as PaginatedResponse<BatchOrderRead>)?.results.filter(
    (value: BatchOrderRead) => value.state !== 'canceled',
  );

  if (!batchOrders) {
    if (isLoading)
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
      <div className={classNames('dashboard__courses__list')}>
        {batchOrders.length === 0 && (
          <div className="dashboard__courses__empty">
            <Banner message={intl.formatMessage(messages.emptyList)} />
          </div>
        )}
        {batchOrders.map((batchOrder) => (
          <div
            key={batchOrder.id}
            className="dashboard__courses__list__item"
            data-testid="order-enrollment-list-item"
          >
            <DashboardItemBatchOrder batchOrder={batchOrder} />
          </div>
        ))}
      </div>
    </div>
  );
};

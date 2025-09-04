import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import classNames from 'classnames';
import { Spinner } from 'components/Spinner';
import SearchBar from 'widgets/Dashboard/components/SearchBar';
import SearchResultsCount from 'widgets/Dashboard/components/SearchResultsCount';
import { useBatchOrder } from 'hooks/useBatchOrder/useBatchOrder';
import { DashboardItemBatchOrder } from 'widgets/Dashboard/components/DashboardItem/BatchOrder';
import { BatchOrder } from 'types/Joanie';

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
    defaultMessage: 'You have no enrollments nor orders yet.',
  },
});

export const DashboardBatchOrders = () => {
  const { methods } = useBatchOrder();
  const { data, isLoading } = methods.get();
  const batchOrders = data?.results.filter((value: BatchOrder) => value.state !== 'canceled');

  if (!batchOrders) {
    if (isLoading) return <Spinner size="large" />;
    else return <div>No batch orders</div>;
  }

  return (
    <div className="dashboard__courses">
      <SearchBar.Container>
        <SearchResultsCount nbResults={batchOrders.length} />
      </SearchBar.Container>
      <div className={classNames('dashboard__courses__list')}>
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

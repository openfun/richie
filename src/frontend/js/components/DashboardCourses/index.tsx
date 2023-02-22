import { defineMessages, FormattedMessage } from 'react-intl';
import { useOrders } from 'hooks/useOrders';
import { DashboardItemOrder } from 'components/DashboardItem/Order/DashboardItemOrder';
import { OrderState } from 'types/Joanie';
import { Spinner } from 'components/Spinner';

const messages = defineMessages({
  loading: {
    defaultMessage: 'Loading orders and enrollments...',
    description: 'Message displayed while loading orders and enrollments',
    id: 'components.DashboardCourses.loading',
  },
});

export const DashboardCourses = () => {
  const orders = useOrders();
  return (
    <div className="dashboard__courses">
      {orders.states.isLoading && (
        <Spinner aria-labelledby="loading-courses-data">
          <span id="loading-courses-data">
            <FormattedMessage {...messages.loading} />
          </span>
        </Spinner>
      )}
      {orders.items
        ?.filter((order) => order.state === OrderState.VALIDATED)
        .map((order) => (
          <DashboardItemOrder key={order.id} order={order} />
        ))}
    </div>
  );
};

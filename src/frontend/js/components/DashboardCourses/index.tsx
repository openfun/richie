import { useOrders } from 'hooks/useOrders';
import { DashboardItemOrder } from 'components/DashboardItem/Order/DashboardItemOrder';
import { OrderState } from 'types/Joanie';
import { Spinner } from 'components/Spinner';

export const DashboardCourses = () => {
  const orders = useOrders();
  return (
    <div className="dashboard__courses">
      {orders.states.isLoading && <Spinner />}
      {orders.items
        ?.filter((order) => order.state === OrderState.VALIDATED)
        .map((order) => (
          <DashboardItemOrder key={order.id} order={order} />
        ))}
    </div>
  );
};

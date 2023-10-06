import { OrderEnrollment, ACTIVE_ORDER_STATES } from 'types/Joanie';

export const getActiveEnrollmentOrder = (orders: OrderEnrollment[], productId: string) => {
  const filter = (order: OrderEnrollment) =>
    ACTIVE_ORDER_STATES.includes(order.state) && order.product === productId;
  return orders.find(filter);
};

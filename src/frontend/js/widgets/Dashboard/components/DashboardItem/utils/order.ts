import { OrderEnrollment, ACTIVE_ORDER_STATES, Order, Product } from 'types/Joanie';

export const getActiveEnrollmentOrder = (orders: OrderEnrollment[], productId: string) => {
  const filter = (order: OrderEnrollment) =>
    ACTIVE_ORDER_STATES.includes(order.state) && order.product_id === productId;
  return orders.find(filter);
};

export const orderNeedsSignature = (order: Order, product?: Product) => {
  return product?.contract_definition && !(order.contract && order.contract.signed_on);
};

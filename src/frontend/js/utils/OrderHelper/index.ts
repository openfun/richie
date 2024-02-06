import {
  OrderEnrollment,
  ACTIVE_ORDER_STATES,
  Order,
  OrderState,
  ContractDefinition,
} from 'types/Joanie';

/**
 * Helper class for orders
 */
export class OrderHelper {
  /**
   * return an Order from the given list that match given productId
   */
  static getActiveEnrollmentOrder(orders: OrderEnrollment[], productId: string) {
    const filter = (order: OrderEnrollment) =>
      ACTIVE_ORDER_STATES.includes(order.state) && order.product_id === productId;
    return orders.find(filter);
  }

  /**
   * tell us if a order need to be sign by it's owner (the learner user).
   */
  static orderNeedsSignature(order: Order, contractDefinition?: ContractDefinition) {
    return (
      order?.state === OrderState.VALIDATED &&
      contractDefinition &&
      !(order.contract && order.contract.student_signed_on)
    );
  }
}

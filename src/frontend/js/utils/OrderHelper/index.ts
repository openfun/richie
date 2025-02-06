import {
  ACTIVE_ORDER_STATES,
  CANCELED_ORDER_STATES,
  ENROLLABLE_ORDER_STATES,
  NestedCourseOrder,
  Order,
  OrderEnrollment,
  OrderState,
  PURCHASABLE_ORDER_STATES,
} from 'types/Joanie';

export enum OrderStatus {
  ASSIGNED = 'assigned',
  CANCELED = 'canceled',
  REFUNDED = 'refunded',
  COMPLETED = 'completed',
  DRAFT = 'draft',
  FAILED_PAYMENT = 'failed_payment',
  NO_PAYMENT = 'no_payment',
  PASSED = 'passed',
  PENDING = 'pending',
  PENDING_PAYMENT = 'pending_payment',
  WAITING_COUNTER_SIGNATURE = 'waiting_counter_signature',
  WAITING_PAYMENT_METHOD = 'waiting_payment_method',
  WAITING_SIGNATURE = 'waiting_signature',
}

/**
 * Helper class for orders
 */
export class OrderHelper {
  static getState(order: Order | NestedCourseOrder) {
    if (OrderHelper.allowEnrollment(order) && OrderHelper.orderNeedsCounterSignature(order)) {
      return OrderStatus.WAITING_COUNTER_SIGNATURE;
    }
    if (order.state === OrderState.COMPLETED && order.certificate_id) {
      return OrderStatus.PASSED;
    }

    const orderStatusMap = {
      [OrderState.ASSIGNED]: OrderStatus.ASSIGNED,
      [OrderState.CANCELED]: OrderStatus.CANCELED,
      [OrderState.REFUNDING]: OrderStatus.CANCELED,
      [OrderState.REFUNDED]: OrderStatus.REFUNDED,
      [OrderState.COMPLETED]: OrderStatus.COMPLETED,
      [OrderState.DRAFT]: OrderStatus.DRAFT,
      [OrderState.FAILED_PAYMENT]: OrderStatus.FAILED_PAYMENT,
      [OrderState.NO_PAYMENT]: OrderStatus.NO_PAYMENT,
      [OrderState.PENDING]: OrderStatus.PENDING,
      [OrderState.PENDING_PAYMENT]: OrderStatus.PENDING_PAYMENT,
      [OrderState.SIGNING]: OrderStatus.WAITING_SIGNATURE,
      [OrderState.TO_SAVE_PAYMENT_METHOD]: OrderStatus.WAITING_PAYMENT_METHOD,
      [OrderState.TO_SIGN]: OrderStatus.WAITING_SIGNATURE,
    };

    if (order.state in orderStatusMap) {
      return orderStatusMap[order.state];
    }

    return null;
  }

  /**
   * return an Order from the given list that match given productId
   */
  static getActiveEnrollmentOrder(orders: OrderEnrollment[], productId: string) {
    const filter = (order: OrderEnrollment) =>
      ACTIVE_ORDER_STATES.includes(order.state) && order.product_id === productId;
    return orders.find(filter);
  }

  static orderNeedsSignature(order: Order | NestedCourseOrder) {
    return [OrderState.TO_SIGN, OrderState.SIGNING].includes(order.state);
  }

  /**
   * tell us if a order need to be sign by the organization.
   */
  static orderNeedsCounterSignature(order: Order | NestedCourseOrder) {
    return (
      ACTIVE_ORDER_STATES.includes(order.state) &&
      order.contract &&
      order.contract.student_signed_on &&
      !order.contract.organization_signed_on
    );
  }

  static allowEnrollment(order?: Order | NestedCourseOrder | OrderEnrollment) {
    if (!order) return false;
    return ENROLLABLE_ORDER_STATES.includes(order.state);
  }

  static isActive(order?: Order | NestedCourseOrder | OrderEnrollment) {
    if (!order) return false;
    return ACTIVE_ORDER_STATES.includes(order.state);
  }

  static isCanceled(order?: Order | NestedCourseOrder | OrderEnrollment) {
    if (!order) return false;
    return CANCELED_ORDER_STATES.includes(order.state);
  }

  static isPurchasable(order?: Order | NestedCourseOrder | OrderEnrollment) {
    if (!order) return true;
    return PURCHASABLE_ORDER_STATES.includes(order.state);
  }
}

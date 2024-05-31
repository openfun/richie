import {
  OrderEnrollment,
  ACTIVE_ORDER_STATES,
  Order,
  OrderState,
  ContractDefinition,
  NestedCourseOrder,
} from 'types/Joanie';

export enum OrderStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  PENDING = 'pending',
  CANCELED = 'canceled',
  WAITING_SIGNATURE = 'waiting_signature',
  WAITING_COUNTER_SIGNATURE = 'waiting_counter_signature',
  COMPLETED = 'completed',
  ON_GOING = 'on_going',
  NO_PAYMENT = 'no_payment',
  PENDING_PAYMENT = 'pending_payment',
  FAILED_PAYMENT = 'failed_payment',
}

/**
 * Helper class for orders
 */
export class OrderHelper {
  static getState(order: Order | NestedCourseOrder, contractDefinition?: ContractDefinition) {
    const { certificate_id: certificateId } = order;

    if (order.state === OrderState.VALIDATED) {
      if (OrderHelper.orderNeedsSignature(order, contractDefinition)) {
        return OrderStatus.WAITING_SIGNATURE;
      }
      if (OrderHelper.orderNeedsCounterSignature(order)) {
        return OrderStatus.WAITING_COUNTER_SIGNATURE;
      }
      if (certificateId) {
        return OrderStatus.COMPLETED;
      } else {
        return OrderStatus.ON_GOING;
      }
    }

    const orderStatusMap = {
      [OrderState.DRAFT]: OrderStatus.DRAFT,
      [OrderState.SUBMITTED]: OrderStatus.SUBMITTED,
      [OrderState.PENDING]: OrderStatus.PENDING,
      [OrderState.CANCELED]: OrderStatus.CANCELED,
      [OrderState.NO_PAYMENT]: OrderStatus.NO_PAYMENT,
      [OrderState.PENDING_PAYMENT]: OrderStatus.PENDING_PAYMENT,
      [OrderState.FAILED_PAYMENT]: OrderStatus.PENDING_PAYMENT,
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

  /**
   * tell us if a order need to be sign by it's owner (the learner user).
   */
  static orderNeedsSignature(
    order: Order | NestedCourseOrder,
    contractDefinition?: ContractDefinition,
  ) {
    return (
      order?.state === OrderState.VALIDATED &&
      contractDefinition &&
      !(order.contract && order.contract.student_signed_on)
    );
  }

  /**
   * tell us if a order need to be sign by the organization.
   */
  static orderNeedsCounterSignature(order: Order | NestedCourseOrder) {
    return (
      order?.state === OrderState.VALIDATED &&
      order.contract &&
      order.contract.student_signed_on &&
      !order.contract.organization_signed_on
    );
  }

  static getFailedInstallment(order: Order) {
    return order.payment_schedule?.find((installment) => installment.state === 'refused');
  }
}

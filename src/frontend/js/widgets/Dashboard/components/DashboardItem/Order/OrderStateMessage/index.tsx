import { FormattedMessage, MessageDescriptor } from 'react-intl';
import { useEffect } from 'react';
import { CertificateOrder, CredentialOrder, OrderState, NestedCourseOrder } from 'types/Joanie';
import { StringHelper } from 'utils/StringHelper';
import { handle } from 'utils/errors/handle';
import { OrderHelper, OrderStatus } from 'utils/OrderHelper';

export interface OrderStateMessageBaseProps {
  order: CredentialOrder | CertificateOrder | NestedCourseOrder;
}

export type MessageKeys =
  | 'statusAssigned'
  | 'statusCanceled'
  | 'statusCompleted'
  | 'statusDraft'
  | 'statusFailedPayment'
  | 'statusNoPayment'
  | 'statusPassed'
  | 'statusPending'
  | 'statusPendingPayment'
  | 'statusRefunded'
  | 'statusWaitingCounterSignature'
  | 'statusWaitingPaymentMethod'
  | 'statusWaitingSignature';

interface OrderStateMessageProps extends OrderStateMessageBaseProps {
  messages: Record<MessageKeys, MessageDescriptor>;
}

const OrderStateMessage = ({ order, messages }: OrderStateMessageProps) => {
  useEffect(() => {
    if (!Object.values(OrderState).includes(order.state)) {
      handle(new Error(`Unknown order state ${order.state}`));
    }
  }, [order.state]);

  const orderStatusMessagesMap = {
    [OrderStatus.ASSIGNED]: messages.statusAssigned,
    [OrderStatus.CANCELED]: messages.statusCanceled,
    [OrderStatus.COMPLETED]: messages.statusCompleted,
    [OrderStatus.DRAFT]: messages.statusDraft,
    [OrderStatus.FAILED_PAYMENT]: messages.statusFailedPayment,
    [OrderStatus.NO_PAYMENT]: messages.statusNoPayment,
    [OrderStatus.PASSED]: messages.statusPassed,
    [OrderStatus.PENDING]: messages.statusPending,
    [OrderStatus.PENDING_PAYMENT]: messages.statusPendingPayment,
    [OrderStatus.REFUNDED]: messages.statusRefunded,
    [OrderStatus.WAITING_COUNTER_SIGNATURE]: messages.statusWaitingCounterSignature,
    [OrderStatus.WAITING_PAYMENT_METHOD]: messages.statusWaitingPaymentMethod,
    [OrderStatus.WAITING_SIGNATURE]: messages.statusWaitingSignature,
  };
  const status = OrderHelper.getState(order);

  if (status === null) {
    return StringHelper.capitalizeFirst(order.state);
  }

  return <FormattedMessage {...orderStatusMessagesMap[status]} />;
};

export default OrderStateMessage;

import { FormattedMessage, MessageDescriptor } from 'react-intl';
import { useEffect } from 'react';
import {
  CertificateOrder,
  CredentialOrder,
  OrderState,
  ContractDefinition,
  NestedCourseOrder,
} from 'types/Joanie';
import { StringHelper } from 'utils/StringHelper';
import { handle } from 'utils/errors/handle';
import { OrderHelper, OrderStatus } from 'utils/OrderHelper';

export interface OrderStateMessageBaseProps {
  order: CredentialOrder | CertificateOrder | NestedCourseOrder;
  contractDefinition?: ContractDefinition;
}

interface OrderStateMessageProps extends OrderStateMessageBaseProps {
  messages: Record<string, MessageDescriptor>;
}

const OrderStateMessage = ({ order, contractDefinition, messages }: OrderStateMessageProps) => {
  useEffect(() => {
    if (!Object.values(OrderState).includes(order.state)) {
      handle(new Error(`Unknown order state ${order.state}`));
    }
  }, [order.state]);

  const orderStatusMessagesMap = {
    [OrderStatus.DRAFT]: messages.statusDraft,
    [OrderStatus.SUBMITTED]: messages.statusSubmitted,
    [OrderStatus.PENDING]: messages.statusPending,
    [OrderStatus.CANCELED]: messages.statusCanceled,
    [OrderStatus.WAITING_SIGNATURE]: messages.statusWaitingSignature,
    [OrderStatus.WAITING_COUNTER_SIGNATURE]: messages.statusWaitingCounterSignature,
    [OrderStatus.COMPLETED]: messages.statusCompleted,
    [OrderStatus.ON_GOING]: messages.statusOnGoing,
  };
  const status = OrderHelper.getState(order, contractDefinition);

  if (status === null) {
    return (
      <FormattedMessage
        {...messages.statusOther}
        values={{ state: StringHelper.capitalizeFirst(order.state) }}
      />
    );
  }

  return <FormattedMessage {...orderStatusMessagesMap[status]} />;
};

export default OrderStateMessage;

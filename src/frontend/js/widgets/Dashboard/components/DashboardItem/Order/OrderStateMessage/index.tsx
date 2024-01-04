import { FormattedMessage, defineMessages } from 'react-intl';
import { useEffect } from 'react';
import { CertificateOrder, CredentialOrder, OrderState, Product } from 'types/Joanie';
import { StringHelper } from 'utils/StringHelper';
import { handle } from 'utils/errors/handle';
import { orderNeedsSignature } from 'widgets/Dashboard/components/DashboardItem/utils/order';

export const messages = defineMessages({
  statusDraft: {
    id: 'components.DashboardItem.Order.OrderStateMessage.statusDraft',
    description: 'Status shown on the dashboard order item when order is draft.',
    defaultMessage: 'Draft',
  },
  statusSubmitted: {
    id: 'components.DashboardItem.Order.OrderStateMessage.statusSubmitted',
    description: 'Status shown on the dashboard order item when order is submitted.',
    defaultMessage: 'Submitted',
  },
  statusPending: {
    id: 'components.DashboardItem.Order.OrderStateMessage.statusPending',
    description: 'Status shown on the dashboard order item when order is pending.',
    defaultMessage: 'Pending',
  },
  statusOnGoing: {
    id: 'components.DashboardItem.Order.OrderStateMessage.statusOnGoing',
    description:
      'Status shown on the dashboard order item when order is validated with no certificate',
    defaultMessage: 'On going',
  },
  statusCompleted: {
    id: 'components.DashboardItem.Order.OrderStateMessage.statusCompleted',
    description:
      'Status shown on the dashboard order item when order is validated with certificate',
    defaultMessage: 'Completed',
  },
  statusWaitingSignature: {
    id: 'components.DashboardItem.Order.OrderStateMessage.statusWaitingSignature',
    description:
      "Status shown on the dashboard order item when order is validated with contract's learner signature missing.",
    defaultMessage: 'Signature required',
  },
  statusCanceled: {
    id: 'components.DashboardItem.Order.OrderStateMessage.statusCanceled',
    description: 'Status shown on the dashboard order item when order is canceled',
    defaultMessage: 'Canceled',
  },
  statusOther: {
    id: 'components.DashboardItem.Order.OrderStateMessage.statusOther',
    description: 'Status shown on the dashboard order item when order status is unknown',
    defaultMessage: '{state}',
  },
});

interface OrderStateMessageProps {
  order: CredentialOrder | CertificateOrder;
  product?: Product;
}

const OrderStateMessage = ({ order, product }: OrderStateMessageProps) => {
  const { certificate_id: certificateId } = order;
  const orderStatusMessages = {
    [OrderState.DRAFT]: messages.statusDraft,
    [OrderState.SUBMITTED]: messages.statusSubmitted,
    [OrderState.PENDING]: messages.statusPending,
    [OrderState.CANCELED]: messages.statusCanceled,
  };

  useEffect(() => {
    if (!Object.values(OrderState).includes(order.state)) {
      handle(new Error(`Unknown order state ${order.state}`));
    }
  }, [order.state]);

  if (order.state === OrderState.VALIDATED) {
    if (orderNeedsSignature(order, product)) {
      return <FormattedMessage {...messages.statusWaitingSignature} />;
    }

    if (certificateId) {
      return <FormattedMessage {...messages.statusCompleted} />;
    } else {
      return <FormattedMessage {...messages.statusOnGoing} />;
    }
  }

  if (order.state in orderStatusMessages) {
    return <FormattedMessage {...orderStatusMessages[order.state]} />;
  }

  return (
    <FormattedMessage
      {...messages.statusOther}
      values={{ state: StringHelper.capitalizeFirst(order.state) }}
    />
  );
};

export default OrderStateMessage;

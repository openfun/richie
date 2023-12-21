import { FormattedMessage } from 'react-intl';
import { useEffect } from 'react';
import { CertificateOrder, CredentialOrder, OrderState, Product } from 'types/Joanie';
import { StringHelper } from 'utils/StringHelper';
import { handle } from 'utils/errors/handle';
import { orderNeedsSignature } from 'widgets/Dashboard/components/DashboardItem/utils/order';

export const messages = {
  statusDraft: {
    id: 'components.OrderStatus.statusDraft',
    description: 'Status shown on the dashboard order item when order is draft.',
    defaultMessage: 'Draft',
  },
  statusSubmitted: {
    id: 'components.OrderStatus.statusSubmitted',
    description: 'Status shown on the dashboard order item when order is submitted.',
    defaultMessage: 'Submitted',
  },
  statusPending: {
    id: 'components.OrderStatus.statusPending',
    description: 'Status shown on the dashboard order item when order is pending.',
    defaultMessage: 'Pending',
  },
  statusOnGoing: {
    id: 'components.OrderStatus.statusOnGoing',
    description:
      'Status shown on the dashboard order item when order is validated with no certificate',
    defaultMessage: 'On going',
  },
  statusCompleted: {
    id: 'components.OrderStatus.statusCompleted',
    description:
      'Status shown on the dashboard order item when order is validated with certificate',
    defaultMessage: 'Completed',
  },
  statusWaitingSignature: {
    id: 'components.OrderStatus.statusWaitingSignature',
    description:
      "Status shown on the dashboard order item when order is validated with contract's learner signature missing.",
    defaultMessage: 'Signature required',
  },
  statusCanceled: {
    id: 'components.OrderStatus.statusCanceled',
    description: 'Status shown on the dashboard order item when order is canceled',
    defaultMessage: 'Canceled',
  },
  statusOther: {
    id: 'components.OrderStatus.statusOther',
    description: 'Status shown on the dashboard order item when order status is unknown',
    defaultMessage: '{state}',
  },
};

interface OrderStatusProps {
  order: CredentialOrder | CertificateOrder;
  product?: Product;
}

const OrderStatus = ({ order, product }: OrderStatusProps) => {
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

export default OrderStatus;

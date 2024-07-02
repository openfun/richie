import { defineMessages } from 'react-intl';
import OrderStateMessage, { OrderStateMessageBaseProps } from '../OrderStateMessage';

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
  statusPendingPayment: {
    id: 'components.DashboardItem.Order.OrderStateMessage.statusPendingPayment',
    description:
      'Status shown on the dashboard order item when order is validated with certificate and pending payment',
    defaultMessage: 'Completed',
  },
  statusWaitingSignature: {
    id: 'components.DashboardItem.Order.OrderStateMessage.statusWaitingSignature',
    description:
      "Status shown on the dashboard order item when order is validated with contract's learner signature missing.",
    defaultMessage: 'Signature required',
  },
  statusWaitingCounterSignature: {
    id: 'components.DashboardItem.Order.OrderStateMessage.statusWaitingCounterSignature',
    description:
      "Status shown on the dashboard order item when order is validated with contract's organization signature missing.",
    defaultMessage: 'On going',
  },
  statusCanceled: {
    id: 'components.DashboardItem.Order.OrderStateMessage.statusCanceled',
    description: 'Status shown on the dashboard order item when order is canceled',
    defaultMessage: 'Canceled',
  },
  statusNoPayment: {
    id: 'components.DashboardItem.Order.OrderStateMessage.statusNoPayment',
    description: 'Status shown on the dashboard order item when order is in no payment state',
    defaultMessage: 'Failed payment',
  },
  statusFailedPayment: {
    id: 'components.DashboardItem.Order.OrderStateMessage.statusFailedPayment',
    description: 'Status shown on the dashboard order item when order is in failed payment state',
    defaultMessage: 'Failed payment',
  },
  statusOther: {
    id: 'components.DashboardItem.Order.OrderStateMessage.statusOther',
    description: 'Status shown on the dashboard order item when order status is unknown',
    defaultMessage: '{state}',
  },
});

const OrderStateLearnerMessage = (props: OrderStateMessageBaseProps) => {
  return <OrderStateMessage {...props} messages={messages} />;
};

export default OrderStateLearnerMessage;

import { defineMessages } from 'react-intl';
import OrderStateMessage, { OrderStateMessageBaseProps, MessageKeys } from '../OrderStateMessage';

export const messages = defineMessages<MessageKeys>({
  statusDraft: {
    id: 'components.DashboardItem.Order.OrderStateLearnerMessage.statusDraft',
    description: 'Status shown on the dashboard order item when order is draft.',
    defaultMessage: 'Pending',
  },
  statusAssigned: {
    id: 'components.DashboardItem.Order.OrderStateLearnerMessage.statusAssigned',
    description: 'Status shown on the dashboard order item when order is assigned.',
    defaultMessage: 'Pending',
  },
  statusPending: {
    id: 'components.DashboardItem.Order.OrderStateLearnerMessage.statusPending',
    description: 'Status shown on the dashboard order item when order is pending.',
    defaultMessage: 'Pending for the first direct debit',
  },
  statusPendingPayment: {
    id: 'components.DashboardItem.Order.OrderStateLearnerMessage.statusPendingPayment',
    description: 'Status shown on the dashboard order item when order is pending for payment',
    defaultMessage: 'On going',
  },
  statusCompleted: {
    id: 'components.DashboardItem.Order.OrderStateLearnerMessage.statusCompleted',
    description: 'Status shown on the dashboard order item when order is completed',
    defaultMessage: 'On going',
  },
  statusWaitingSignature: {
    id: 'components.DashboardItem.Order.OrderStateLearnerMessage.statusWaitingSignature',
    description:
      "Status shown on the dashboard order item when order is validated with contract's learner signature missing.",
    defaultMessage: 'Signature required',
  },
  statusWaitingCounterSignature: {
    id: 'components.DashboardItem.Order.OrderStateLearnerMessage.statusWaitingCounterSignature',
    description:
      "Status shown on the dashboard order item when order is validated with contract's organization signature missing.",
    defaultMessage: 'On going',
  },
  statusWaitingPaymentMethod: {
    id: 'components.DashboardItem.Order.OrderStateLearnerMessage.statusWaitingPaymentMethod',
    description:
      'Status shown on the dashboard order item when order is in to_save_payment_method state.',
    defaultMessage: 'Payment method is missing',
  },
  statusCanceled: {
    id: 'components.DashboardItem.Order.OrderStateLearnerMessage.statusCanceled',
    description: 'Status shown on the dashboard order item when order is canceled',
    defaultMessage: 'Canceled',
  },
  statusNoPayment: {
    id: 'components.DashboardItem.Order.OrderStateLearnerMessage.statusNoPayment',
    description: 'Status shown on the dashboard order item when order is in no payment state',
    defaultMessage: 'First direct debit has failed',
  },
  statusFailedPayment: {
    id: 'components.DashboardItem.Order.OrderStateLearnerMessage.statusFailedPayment',
    description: 'Status shown on the dashboard order item when order is in failed payment state',
    defaultMessage: 'Last direct debit has failed',
  },
  statusPassed: {
    id: 'components.DashboardItem.Order.OrderStateLearnerMessage.statusPassed',
    description:
      'Status shown on the dashboard order item when order is completed and has a certificate',
    defaultMessage: 'Successfully completed',
  },
  statusRefunded: {
    id: 'components.DashboardItem.Order.OrderStateLearnerMessage.statusRefunded',
    description: 'Status shown on the dashboard order item when order is refunded',
    defaultMessage: 'Refunded',
  },
});

const OrderStateLearnerMessage = (props: OrderStateMessageBaseProps) => {
  return <OrderStateMessage {...props} messages={messages} />;
};

export default OrderStateLearnerMessage;

import { defineMessages } from 'react-intl';
import OrderStateMessage, { MessageKeys, OrderStateMessageBaseProps } from '../OrderStateMessage';

export const messages = defineMessages<MessageKeys>({
  statusDraft: {
    id: 'components.DashboardItem.Order.OrderStateTeacherMessage.statusDraft',
    description: 'Status shown on the dashboard order item when order is draft.',
    defaultMessage: 'Pending',
  },
  statusAssigned: {
    id: 'components.DashboardItem.Order.OrderStateTeacherMessage.statusAssigned',
    description: 'Status shown on the dashboard order item when order is assigned.',
    defaultMessage: 'Pending',
  },
  statusPending: {
    id: 'components.DashboardItem.Order.OrderStateTeacherMessage.statusPending',
    description: 'Status shown on the dashboard order item when order is pending.',
    defaultMessage: 'Pending for the first direct debit',
  },
  statusPendingPayment: {
    id: 'components.DashboardItem.Order.OrderStateTeacherMessage.statusPendingPayment',
    description:
      'Status shown on the dashboard order item when order is validated with no certificate',
    defaultMessage: 'On going',
  },
  statusCompleted: {
    id: 'components.DashboardItem.Order.OrderStateTeacherMessage.statusCompleted',
    description: 'Status shown on the dashboard order item when order is completed',
    defaultMessage: 'On going',
  },
  statusWaitingSignature: {
    id: 'components.DashboardItem.Order.OrderStateTeacherMessage.statusWaitingSignature',
    description:
      "Status shown on the dashboard order item when order is validated with contract's learner signature missing.",
    defaultMessage: "Pending for learner's signature",
  },
  statusWaitingPaymentMethod: {
    id: 'components.DashboardItem.Order.OrderStateTeacherMessage.statusWaitingPaymentMethod',
    description:
      'Status shown on the dashboard order item when order is in to_save_payment_method state.',
    defaultMessage: 'Payment method is missing',
  },
  statusWaitingCounterSignature: {
    id: 'components.DashboardItem.Order.OrderStateTeacherMessage.statusWaitingCounterSignature',
    description:
      "Status shown on the dashboard order item when order is validated with contract's organization signature missing.",
    defaultMessage: 'To be signed',
  },
  statusCanceled: {
    id: 'components.DashboardItem.Order.OrderStateTeacherMessage.statusCanceled',
    description: 'Status shown on the dashboard order item when order is canceled',
    defaultMessage: 'Canceled',
  },
  statusNoPayment: {
    id: 'components.DashboardItem.Order.OrderStateTeacherMessage.statusNoPayment',
    description: 'Status shown on the dashboard order item when order is in no payment state',
    defaultMessage: 'First direct debit has failed',
  },
  statusFailedPayment: {
    id: 'components.DashboardItem.Order.OrderStateTeacherMessage.statusFailedPayment',
    description: 'Status shown on the dashboard order item when order is in failed payment state',
    defaultMessage: 'Last direct debit has failed',
  },
  statusPassed: {
    id: 'components.DashboardItem.Order.OrderStateTeacherMessage.statusPassed',
    description:
      'Status shown on the dashboard order item when order is completed with certificate',
    defaultMessage: 'Certified',
  },
  statusRefunded: {
    id: 'components.DashboardItem.Order.OrderStateTeacherMessage.statusRefunded',
    description: 'Status shown on the dashboard order item when order is refunded',
    defaultMessage: 'Refunded',
  },
});

const OrderStateTeacherMessage = (props: OrderStateMessageBaseProps) => {
  return <OrderStateMessage {...props} messages={messages} />;
};

export default OrderStateTeacherMessage;

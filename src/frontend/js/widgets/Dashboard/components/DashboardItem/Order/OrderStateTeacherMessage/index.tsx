import { defineMessages } from 'react-intl';
import OrderStateMessage, { OrderStateMessageBaseProps } from '../OrderStateMessage';

export const messages = defineMessages({
  statusDraft: {
    id: 'components.DashboardItem.Order.OrderStateTeacherMessage.statusDraft',
    description: 'Status shown on the dashboard order item when order is draft.',
    defaultMessage: 'Pending',
  },
  statusSubmitted: {
    id: 'components.DashboardItem.Order.OrderStateTeacherMessage.statusSubmitted',
    description: 'Status shown on the dashboard order item when order is submitted.',
    defaultMessage: 'Pending',
  },
  statusPending: {
    id: 'components.DashboardItem.Order.OrderStateTeacherMessage.statusPending',
    description: 'Status shown on the dashboard order item when order is pending.',
    defaultMessage: 'Pending',
  },
  statusOnGoing: {
    id: 'components.DashboardItem.Order.OrderStateTeacherMessage.statusOnGoing',
    description:
      'Status shown on the dashboard order item when order is validated with no certificate',
    defaultMessage: 'Enrolled',
  },
  statusCompleted: {
    id: 'components.DashboardItem.Order.OrderStateTeacherMessage.statusCompleted',
    description:
      'Status shown on the dashboard order item when order is validated with certificate',
    defaultMessage: 'Certified',
  },
  statusWaitingSignature: {
    id: 'components.DashboardItem.Order.OrderStateTeacherMessage.statusWaitingSignature',
    description:
      "Status shown on the dashboard order item when order is validated with contract's learner signature missing.",
    defaultMessage: "Pending for learner's signature",
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
  statusOther: {
    id: 'components.DashboardItem.Order.OrderStateTeacherMessage.statusOther',
    description: 'Status shown on the dashboard order item when order status is unknown',
    defaultMessage: '{state}',
  },
});

const OrderStateTeacherMessage = (props: OrderStateMessageBaseProps) => {
  return <OrderStateMessage {...props} messages={messages} />;
};

export default OrderStateTeacherMessage;

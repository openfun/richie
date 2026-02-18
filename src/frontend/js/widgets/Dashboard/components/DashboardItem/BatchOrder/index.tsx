import { defineMessages, FormattedMessage, FormattedNumber, useIntl } from 'react-intl';
import { generatePath } from 'react-router';
import { BatchOrderRead, BatchOrderState } from 'types/Joanie';
import { PaymentMethod } from 'components/PaymentInterfaces/types';
import Badge from 'components/Badge';
import { DashboardItem } from 'widgets/Dashboard/components/DashboardItem/index';
import { Icon, IconTypeEnum } from 'components/Icon';
import { RouterButton } from 'widgets/Dashboard/components/RouterButton';
import { LearnerDashboardPaths } from 'widgets/Dashboard/utils/learnerRoutesPaths';
import { DashboardBatchOrderSubItems } from './DashboardBatchOrderSubItems';
import { BatchOrderPaymentManager } from './BatchOrderPaymentModal/BatchOrderPaymentManager';

const messages = defineMessages({
  seats: {
    id: 'batchOrder.seats',
    description: 'Text displayed for seats value in batch order',
    defaultMessage: '{nb_seats} seats',
  },
  seatsCount: {
    id: 'batchOrder.seatsCount',
    description: 'Text displayed for seats count in batch order (owned / total)',
    defaultMessage: '{seats_owned}/{nb_seats} seats',
  },
  [BatchOrderState.DRAFT]: {
    id: 'batchOrder.status.draft',
    description: 'Status label for a draft batch order',
    defaultMessage: 'Draft',
  },
  [BatchOrderState.ASSIGNED]: {
    id: 'batchOrder.status.assigned',
    description: 'Status label for an assigned batch order',
    defaultMessage: 'Assigned',
  },
  [BatchOrderState.QUOTED]: {
    id: 'batchOrder.status.quoted',
    description: 'Status label for a quoted batch order',
    defaultMessage: 'Quoted',
  },
  [BatchOrderState.TO_SIGN]: {
    id: 'batchOrder.status.to_sign',
    description: 'Status label for a batch order awaiting signature',
    defaultMessage: 'To sign',
  },
  [BatchOrderState.SIGNING]: {
    id: 'batchOrder.status.signing',
    description: 'Status label for a batch order in signing process',
    defaultMessage: 'Signing',
  },
  [BatchOrderState.PENDING]: {
    id: 'batchOrder.status.pending',
    description: 'Status label for a pending batch order',
    defaultMessage: 'Pending',
  },
  [BatchOrderState.PROCESS_PAYMENT]: {
    id: 'batchOrder.status.processPayment',
    description: 'Status label for a process payment batch order',
    defaultMessage: 'Process payment',
  },
  [BatchOrderState.FAILED_PAYMENT]: {
    id: 'batchOrder.status.failed_payment',
    description: 'Status label for a batch order with failed payment',
    defaultMessage: 'Failed payment',
  },
  [BatchOrderState.CANCELED]: {
    id: 'batchOrder.status.canceled',
    description: 'Status label for a canceled batch order',
    defaultMessage: 'Canceled',
  },
  [BatchOrderState.COMPLETED]: {
    id: 'batchOrder.status.completed',
    description: 'Status label for a completed batch order',
    defaultMessage: 'Completed',
  },
  [PaymentMethod.BANK_TRANSFER]: {
    id: 'batchOrder.payment.bank',
    description: 'Label for bank transfer payment method',
    defaultMessage: 'Bank transfer',
  },
  [PaymentMethod.CARD_PAYMENT]: {
    id: 'batchOrder.payment.card',
    description: 'Label for card payment method',
    defaultMessage: 'Card payment',
  },
  [PaymentMethod.PURCHASE_ORDER]: {
    id: 'batchOrder.payment.order',
    description: 'Label for purchase order payment method',
    defaultMessage: 'Purchase order',
  },
  paymentNeededButton: {
    id: 'components.ProductCertificateFooter.paymentNeededButton',
    description: 'Button label for the payment needed message',
    defaultMessage: 'Pay {amount}',
  },
  reference: {
    id: 'batchOrder.reference',
    description: 'Reference label displayed with the batch order ID',
    defaultMessage: 'Ref. {id}',
  },
  viewAll: {
    id: 'batchOrder.viewAll',
    description: 'Button label to navigate to the list of all batch orders',
    defaultMessage: 'View all batch orders',
  },
  viewOne: {
    id: 'batchOrder.viewOne',
    description: 'Button label to navigate to a single batch order details',
    defaultMessage: 'View details',
  },
  enrolledStudents: {
    id: 'batchOrder.enrolledStudents',
    description: 'Text displayed for enrolled students count',
    defaultMessage: 'enrolled students',
  },
});

export const DashboardItemBatchOrder = ({
  batchOrder,
  showDetails = false,
}: {
  batchOrder: BatchOrderRead;
  showDetails?: boolean;
}) => {
  const intl = useIntl();
  const needsPayment =
    (batchOrder.state === BatchOrderState.PENDING ||
      batchOrder.state === BatchOrderState.PROCESS_PAYMENT) &&
    batchOrder.payment_method === PaymentMethod.CARD_PAYMENT;

  return (
    <div className="dashboard-item-order">
      <DashboardItem
        data-testid={`dashboard-item-batch-order-${batchOrder.id}`}
        title={batchOrder.offering?.product.title}
        code={intl.formatMessage(messages.reference, { id: batchOrder.id })}
        imageUrl={batchOrder.offering?.course.cover?.src}
        footer={
          <div className="dashboard-item-order__footer">
            <div className="dashboard-item__block__status">
              {batchOrder.state && (
                <Badge color="primary">
                  <div className="dashboard-item__block__status__badge">
                    <FormattedMessage {...messages[batchOrder.state]} />
                  </div>
                </Badge>
              )}
              <div className="dashboard-item__block__information">
                <Icon name={IconTypeEnum.GROUPS} size="small" />
                <span>
                  {batchOrder.seats_owned
                    ? intl.formatMessage(messages.seatsCount, {
                        seats_owned: batchOrder.seats_owned || 0,
                        nb_seats: batchOrder.nb_seats,
                      })
                    : intl.formatMessage(messages.seats, {
                        nb_seats: batchOrder.nb_seats,
                      })}
                </span>
              </div>
              {batchOrder.payment_method && (
                <div className="dashboard-item__block__information">
                  <Icon name={IconTypeEnum.MONEY} size="small" />
                  <FormattedMessage {...messages[batchOrder.payment_method]} />
                </div>
              )}
              {showDetails && (
                <div className="dashboard-item__block__information">
                  <Icon name={IconTypeEnum.OFFER_SUBSCRIPTION} size="small" />
                  <span>
                    <FormattedNumber
                      value={batchOrder.total}
                      currency={batchOrder.currency}
                      style="currency"
                    />
                  </span>
                </div>
              )}
            </div>
            <RouterButton
              size="small"
              className="dashboard-item__button"
              href={
                showDetails
                  ? generatePath(LearnerDashboardPaths.BATCH_ORDERS, {
                      batchOrderId: batchOrder.id!,
                    })
                  : generatePath(LearnerDashboardPaths.BATCH_ORDER, {
                      batchOrderId: batchOrder.id!,
                    })
              }
              data-testid="dashboard-item-batch-order__button"
            >
              {intl.formatMessage(showDetails ? messages.viewAll : messages.viewOne)}
            </RouterButton>
          </div>
        }
      >
        {needsPayment && <BatchOrderPaymentManager batchOrder={batchOrder} />}
        {showDetails && <DashboardBatchOrderSubItems batchOrder={batchOrder} />}
      </DashboardItem>
    </div>
  );
};

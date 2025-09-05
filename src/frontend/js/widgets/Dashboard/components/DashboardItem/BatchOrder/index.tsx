import { BatchOrder, BatchOrderState } from 'types/Joanie';
import { DashboardItem } from '../index';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { RouterButton } from '../../RouterButton';
import { generatePath } from 'react-router';
import { LearnerDashboardPaths } from 'widgets/Dashboard/utils/learnerRoutesPaths';
import { Icon, IconTypeEnum } from 'components/Icon';
import Badge from 'components/Badge';
import { PaymentMethod } from 'components/PaymentInterfaces/types';

interface DashboardItemBatchOrderProps {
  batchOrder: BatchOrder;
  showDetails?: boolean;
}

const messages = defineMessages({
  [BatchOrderState.DRAFT]: { id: 'batchOrder.status.draft', defaultMessage: 'Draft' },
  [BatchOrderState.ASSIGNED]: { id: 'batchOrder.status.assigned', defaultMessage: 'Assigned' },
  [BatchOrderState.QUOTED]: { id: 'batchOrder.status.quoted', defaultMessage: 'Quoted' },
  [BatchOrderState.TO_SIGN]: { id: 'batchOrder.status.to_sign', defaultMessage: 'To sign' },
  [BatchOrderState.SIGNING]: { id: 'batchOrder.status.signing', defaultMessage: 'Signing' },
  [BatchOrderState.PENDING]: { id: 'batchOrder.status.pending', defaultMessage: 'Pending' },
  [BatchOrderState.FAILED_PAYMENT]: {
    id: 'batchOrder.status.failed_payment',
    defaultMessage: 'Failed payment',
  },
  [BatchOrderState.CANCELED]: { id: 'batchOrder.status.canceled', defaultMessage: 'Canceled' },
  [BatchOrderState.COMPLETED]: { id: 'batchOrder.status.completed', defaultMessage: 'Completed' },
  [PaymentMethod.BANK_TRANSFER]: {
    id: 'batchOrder.payment.bank',
    defaultMessage: 'Bank transfer',
  },
  [PaymentMethod.CARD_PAYMENT]: { id: 'batchOrder.payment.card', defaultMessage: 'Card payment' },
  [PaymentMethod.PURCHASE_ORDER]: {
    id: 'batchOrder.payment.order',
    defaultMessage: 'Purchase order',
  },
  accessBatchOrder: {
    id: 'batchOrder.action.view',
    defaultMessage: 'View details',
  },
  seats: {
    id: 'batchOrder.seats',
    defaultMessage: 'seats',
  },
});

export const DashboardItemBatchOrder = ({ batchOrder }: DashboardItemBatchOrderProps) => {
  const intl = useIntl();

  return (
    <div className="dashboard-item-order">
      <DashboardItem
        data-testid={`dashboard-item-order-${batchOrder.id}`}
        title={batchOrder.offering?.product_title}
        code={'Ref. ' + batchOrder.id}
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
              {batchOrder.nb_seats && (
                <div className="dashboard-item__block__information">
                  <Icon name={IconTypeEnum.GROUPS} size="small" />
                  <span>{batchOrder.nb_seats}</span>
                  <span>{intl.formatMessage(messages.seats)}</span>
                </div>
              )}
              {batchOrder.payment_method && (
                <div className="dashboard-item__block__information">
                  <Icon name={IconTypeEnum.MONEY} size="small" />
                  <FormattedMessage {...messages[batchOrder.payment_method]} />
                </div>
              )}
            </div>
            <RouterButton
              size="small"
              className="dashboard-item__button"
              href={generatePath(LearnerDashboardPaths.BATCH_ORDER, {
                batchOrderId: batchOrder.id!,
              })}
              data-testid="dashboard-item-order__button"
            >
              {intl.formatMessage(messages.accessBatchOrder)}
            </RouterButton>
          </div>
        }
      />
    </div>
  );
};

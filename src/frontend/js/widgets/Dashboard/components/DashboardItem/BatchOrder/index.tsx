import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { generatePath } from 'react-router';
import { BatchOrder, BatchOrderState } from 'types/Joanie';
import { Icon, IconTypeEnum } from 'components/Icon';
import { RouterButton } from 'widgets/Dashboard/components/RouterButton';
import { LearnerDashboardPaths } from 'widgets/Dashboard/utils/learnerRoutesPaths';
import { DashboardSubItem } from 'widgets/Dashboard/components/DashboardItem/DashboardSubItem';
import { DashboardSubItemsList } from 'widgets/Dashboard/components/DashboardItem/DashboardSubItemsList';
import { DashboardItem } from '../index';
import Badge from 'components/Badge';
import { PaymentMethod } from 'components/PaymentInterfaces/types';

const messages = defineMessages({
  accessBatchOrder: {
    id: 'components.DashboardItemBatchOrder.access',
    defaultMessage: 'View details',
  },
  accessBatchOrders: {
    id: 'components.DashboardItemBatchOrder.accessAll',
    defaultMessage: 'View all batch orders',
  },
  seats: {
    id: 'components.DashboardItemBatchOrder.seats',
    defaultMessage: 'seats',
  },
  stepCompanyTitle: {
    id: 'batchOrder.step.company',
    defaultMessage: 'Organization',
  },
  stepAdminTitle: {
    id: 'batchOrder.step.admin',
    defaultMessage: 'Follow-up',
  },
  stepParticipantsTitle: {
    id: 'batchOrder.step.participants',
    defaultMessage: 'Participants',
  },
  stepFinancingTitle: {
    id: 'batchOrder.step.financing',
    defaultMessage: 'Financing',
  },
  stepBillingTitle: {
    id: 'batchOrder.step.billing',
    defaultMessage: 'Billing',
  },
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
});

interface DashboardItemBatchOrderProps {
  batchOrder: BatchOrder;
  showDetails?: boolean;
}

export const DashboardItemBatchOrder = ({
  batchOrder,
  showDetails = false,
}: DashboardItemBatchOrderProps) => {
  const intl = useIntl();

  return (
    <div className="dashboard-item-order">
      <DashboardItem
        data-testid={`dashboard-item-batch-order-${batchOrder.id}`}
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
            {showDetails ? (
              <RouterButton
                size="small"
                className="dashboard-item__button"
                href={generatePath(LearnerDashboardPaths.BATCH_ORDER, {
                  batchOrderId: batchOrder.id!,
                })}
                data-testid="dashboard-item-batch-order__button"
              >
                {intl.formatMessage(messages.accessBatchOrders)}
              </RouterButton>
            ) : (
              <RouterButton
                size="small"
                className="dashboard-item__button"
                href={generatePath(LearnerDashboardPaths.BATCH_ORDER, {
                  batchOrderId: batchOrder.id!,
                })}
                data-testid="dashboard-item-batch-order__button"
              >
                {intl.formatMessage(messages.accessBatchOrder)}
              </RouterButton>
            )}
          </div>
        }
      >
        {showDetails && (
          <DashboardSubItemsList
            subItems={[
              <DashboardSubItem
                title="Company"
                footer={
                  <div>
                    <div>{batchOrder.company_name}</div>
                    <div>{batchOrder.identification_number}</div>
                    <div>{batchOrder.address}</div>
                    <div>
                      {batchOrder.postcode} {batchOrder.city} {batchOrder.country}
                    </div>
                  </div>
                }
              />,
              <DashboardSubItem
                title="Administrative contact"
                footer={
                  <div>
                    <div>
                      {batchOrder.administrative_firstname} {batchOrder.administrative_lastname}
                    </div>
                    <div>{batchOrder.administrative_profession}</div>
                    <div>{batchOrder.administrative_email}</div>
                    <div>{batchOrder.administrative_telephone}</div>
                  </div>
                }
              />,
              <DashboardSubItem title="Participants" footer={<div>{batchOrder.nb_seats}</div>} />,
              <DashboardSubItem
                title="Payment"
                footer={
                  <div>
                    {batchOrder.payment_method && (
                      <div>
                        <FormattedMessage {...messages[batchOrder.payment_method]} />
                      </div>
                    )}
                    <div>{batchOrder.funding_entity}</div>
                    <div>{batchOrder.funding_amount}</div>
                  </div>
                }
              />,
              <DashboardSubItem
                title="Billing"
                footer={
                  <div>
                    <div>{batchOrder.billing?.address}</div>
                    <div>
                      {batchOrder.billing?.postcode} {batchOrder.billing?.city}
                      {batchOrder.billing?.country}
                    </div>
                  </div>
                }
              />,
            ]}
          />
        )}
      </DashboardItem>
    </div>
  );
};

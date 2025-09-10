import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { BatchOrder, BatchOrderRead, BatchOrderState, Billing } from 'types/Joanie';
import { PaymentMethod } from 'components/PaymentInterfaces/types';
import { DashboardItem } from '../index';
import { DashboardSubItem } from 'widgets/Dashboard/components/DashboardItem/DashboardSubItem';
import { DashboardSubItemsList } from 'widgets/Dashboard/components/DashboardItem/DashboardSubItemsList';
import { Icon, IconTypeEnum } from 'components/Icon';
import { RouterButton } from 'widgets/Dashboard/components/RouterButton';
import { LearnerDashboardPaths } from 'widgets/Dashboard/utils/learnerRoutesPaths';
import { generatePath } from 'react-router';
import Badge from 'components/Badge';

const messages = defineMessages({
  seats: { id: 'batchOrder.seats', defaultMessage: 'Seats' },
  labelName: { id: 'batchOrder.label.name', defaultMessage: 'Name' },
  labelProfession: { id: 'batchOrder.label.profession', defaultMessage: 'Profession' },
  labelEmail: { id: 'batchOrder.label.email', defaultMessage: 'Email' },
  labelPhone: { id: 'batchOrder.label.phone', defaultMessage: 'Phone' },
  labelMethod: { id: 'batchOrder.label.method', defaultMessage: 'Method' },
  labelEntity: { id: 'batchOrder.label.entity', defaultMessage: 'Entity' },
  labelAmount: { id: 'batchOrder.label.amount', defaultMessage: 'Amount' },
  labelCompany: { id: 'batchOrder.label.company', defaultMessage: 'Company' },
  labelSiret: { id: 'batchOrder.label.siret', defaultMessage: 'SIRET' },
  labelVAT: { id: 'batchOrder.label.vat', defaultMessage: 'VAT' },
  labelAddress: { id: 'batchOrder.label.address', defaultMessage: 'Address' },
  labelPostcode: { id: 'batchOrder.label.postcode', defaultMessage: 'Postcode' },
  labelCity: { id: 'batchOrder.label.city', defaultMessage: 'City' },
  labelCountry: { id: 'batchOrder.label.country', defaultMessage: 'Country' },
  labelBilling: { id: 'batchOrder.label.billing', defaultMessage: 'Billing' },
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
  [PaymentMethod.BANK_TRANSFER]: { id: 'batchOrder.payment.bank', defaultMessage: 'Bank transfer' },
  [PaymentMethod.CARD_PAYMENT]: { id: 'batchOrder.payment.card', defaultMessage: 'Card payment' },
  [PaymentMethod.PURCHASE_ORDER]: {
    id: 'batchOrder.payment.order',
    defaultMessage: 'Purchase order',
  },
});

const DashboardItemField = ({
  label,
  value,
}: {
  label: React.ReactNode;
  value?: React.ReactNode;
}) =>
  value ? (
    <div>
      <span className="dashboard-item__label">{label}: </span>
      {value}
    </div>
  ) : null;

export const DashboardItemBatchOrder = ({
  batchOrder,
  showDetails = false,
}: {
  batchOrder: BatchOrderRead;
  showDetails?: boolean;
}) => {
  const intl = useIntl();

  const renderBilling = (billing: Billing) => (
    <div className="content">
      <DashboardItemField
        label={<FormattedMessage {...messages.labelCompany} />}
        value={billing.company_name}
      />
      <DashboardItemField
        label={<FormattedMessage {...messages.labelSiret} />}
        value={billing.identification_number}
      />
      <DashboardItemField
        label={<FormattedMessage {...messages.labelName} />}
        value={billing.contact_name}
      />
      <DashboardItemField
        label={<FormattedMessage {...messages.labelEmail} />}
        value={billing.contact_email}
      />
      <DashboardItemField
        label={<FormattedMessage {...messages.labelAddress} />}
        value={billing.address}
      />
      <DashboardItemField
        label={<FormattedMessage {...messages.labelPostcode} />}
        value={billing.postcode}
      />
      <DashboardItemField
        label={<FormattedMessage {...messages.labelCity} />}
        value={billing.city}
      />
      <DashboardItemField
        label={<FormattedMessage {...messages.labelCountry} />}
        value={billing.country}
      />
    </div>
  );

  const subItems = [
    <DashboardSubItem
      key="company"
      title={intl.formatMessage(messages.labelCompany)}
      footer={
        <div className="content">
          <DashboardItemField
            label={<FormattedMessage {...messages.labelCompany} />}
            value={batchOrder.company_name}
          />
          <DashboardItemField
            label={<FormattedMessage {...messages.labelSiret} />}
            value={batchOrder.identification_number}
          />
          <DashboardItemField
            label={<FormattedMessage {...messages.labelVAT} />}
            value={batchOrder.vat_registration}
          />
          <DashboardItemField
            label={<FormattedMessage {...messages.labelAddress} />}
            value={batchOrder.address}
          />
          <DashboardItemField
            label={<FormattedMessage {...messages.labelPostcode} />}
            value={batchOrder.postcode}
          />
          <DashboardItemField
            label={<FormattedMessage {...messages.labelCity} />}
            value={batchOrder.city}
          />
          <DashboardItemField
            label={<FormattedMessage {...messages.labelCountry} />}
            value={batchOrder.country}
          />
        </div>
      }
    />,
    <DashboardSubItem
      key="admin"
      title={intl.formatMessage(messages.labelName)}
      footer={
        <div className="content">
          <DashboardItemField
            label={<FormattedMessage {...messages.labelName} />}
            value={`${batchOrder.administrative_firstname} ${batchOrder.administrative_lastname}`}
          />
          <DashboardItemField
            label={<FormattedMessage {...messages.labelProfession} />}
            value={batchOrder.administrative_profession}
          />
          <DashboardItemField
            label={<FormattedMessage {...messages.labelEmail} />}
            value={batchOrder.administrative_email}
          />
          <DashboardItemField
            label={<FormattedMessage {...messages.labelPhone} />}
            value={batchOrder.administrative_telephone}
          />
        </div>
      }
    />,
    <DashboardSubItem
      key="participants"
      title={intl.formatMessage(messages.seats)}
      footer={
        <div className="content">
          <DashboardItemField
            label={<FormattedMessage {...messages.seats} />}
            value={batchOrder.nb_seats}
          />
        </div>
      }
    />,
    <DashboardSubItem
      key="financing"
      title={intl.formatMessage(messages.labelEntity)}
      footer={
        <div className="content">
          <DashboardItemField
            label={<FormattedMessage {...messages.labelMethod} />}
            value={
              batchOrder.payment_method && (
                <FormattedMessage {...messages[batchOrder.payment_method]} />
              )
            }
          />
          <DashboardItemField
            label={<FormattedMessage {...messages.labelEntity} />}
            value={batchOrder.funding_entity}
          />
          <DashboardItemField
            label={<FormattedMessage {...messages.labelAmount} />}
            value={batchOrder.funding_amount}
          />
        </div>
      }
    />,
  ];

  if (batchOrder.billing) {
    subItems.push(
      <DashboardSubItem
        key="billing"
        title={intl.formatMessage(messages.labelBilling)}
        footer={renderBilling(batchOrder.billing)}
      />,
    );
  }

  return (
    <div className="dashboard-item-order">
      <DashboardItem
        data-testid={`dashboard-item-batch-order-${batchOrder.id}`}
        title={batchOrder.offering?.product_title}
        code={`Ref. ${batchOrder.id}`}
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
              {showDetails && (
                <div className="dashboard-item__block__information">
                  <Icon name={IconTypeEnum.MONEY} size="small" />
                  <span>
                    {intl.formatNumber(1490, {
                      style: 'currency',
                      currency: '€',
                    })}
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
              {intl.formatMessage(
                showDetails
                  ? { id: 'batchOrder.viewAll', defaultMessage: 'View all batch orders' }
                  : { id: 'batchOrder.viewOne', defaultMessage: 'View details' },
              )}
            </RouterButton>
          </div>
        }
      >
        {showDetails && <DashboardSubItemsList subItems={subItems} />}
      </DashboardItem>
    </div>
  );
};

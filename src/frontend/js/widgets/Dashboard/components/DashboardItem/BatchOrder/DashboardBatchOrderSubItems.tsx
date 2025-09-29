import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { PaymentMethod } from 'components/PaymentInterfaces/types';
import { BatchOrderRead } from 'types/Joanie';
import { DashboardSubItem } from 'widgets/Dashboard/components/DashboardItem/DashboardSubItem';
import { DashboardSubItemsList } from '../DashboardSubItemsList';

const messages = defineMessages({
  stepCompany: {
    id: 'batchOrder.title.company',
    description: 'Step label for company information in the batch order form',
    defaultMessage: 'Organization',
  },
  stepAdmin: {
    id: 'batchOrder.title.admin',
    description: 'Step label for administrative follow-up in the batch order form',
    defaultMessage: 'Follow-up',
  },
  stepParticipants: {
    id: 'batchOrder.title.partipants',
    description: 'Step label for participants information in the batch order form',
    defaultMessage: 'Participants',
  },
  stepFinancing: {
    id: 'batchOrder.title.financing',
    description: 'Step label for financing/payment in the batch order form',
    defaultMessage: 'Financing',
  },
  stepSignatory: {
    id: 'batchOrder.title.signatory',
    description: 'section with details about the person responsible for signing the quote',
    defaultMessage: 'Signatory',
  },
  seats: {
    id: 'batchOrder.seats',
    description: 'Text displayed for seats value in batch order',
    defaultMessage: 'Seats',
  },
  labelName: {
    id: 'batchOrder.label.name',
    description: 'Label displayed for the name field in batch order form',
    defaultMessage: 'Name',
  },
  labelProfession: {
    id: 'batchOrder.label.profession',
    description: 'Label displayed for the profession field in batch order form',
    defaultMessage: 'Profession',
  },
  labelEmail: {
    id: 'batchOrder.label.email',
    description: 'Label displayed for the email field in batch order form',
    defaultMessage: 'Email',
  },
  labelPhone: {
    id: 'batchOrder.label.phone',
    description: 'Label displayed for the phone field in batch order form',
    defaultMessage: 'Phone',
  },
  labelMethod: {
    id: 'batchOrder.label.method',
    description: 'Label displayed for the payment method field in batch order form',
    defaultMessage: 'Method',
  },
  labelEntity: {
    id: 'batchOrder.label.entity',
    description: 'Label displayed for the entity field in batch order form',
    defaultMessage: 'Entity',
  },
  labelAmount: {
    id: 'batchOrder.label.amount',
    description: 'Label displayed for the amount field in batch order form',
    defaultMessage: 'Amount',
  },
  labelCompany: {
    id: 'batchOrder.label.company',
    description: 'Label displayed for the company field in batch order form',
    defaultMessage: 'Company',
  },
  labelSiret: {
    id: 'batchOrder.label.siret',
    description: 'Label displayed for the SIRET field in batch order form',
    defaultMessage: 'SIRET',
  },
  labelVAT: {
    id: 'batchOrder.label.vat',
    description: 'Label displayed for the VAT field in batch order form',
    defaultMessage: 'VAT',
  },
  labelAddress: {
    id: 'batchOrder.label.address',
    description: 'Label displayed for the address field in batch order form',
    defaultMessage: 'Address',
  },
  labelPostcode: {
    id: 'batchOrder.label.postcode',
    description: 'Label displayed for the postcode field in batch order form',
    defaultMessage: 'Postcode',
  },
  labelCity: {
    id: 'batchOrder.label.city',
    description: 'Label displayed for the city field in batch order form',
    defaultMessage: 'City',
  },
  labelCountry: {
    id: 'batchOrder.label.country',
    description: 'Label displayed for the country field in batch order form',
    defaultMessage: 'Country',
  },
  labelBilling: {
    id: 'batchOrder.label.billing',
    description: 'Label displayed for the billing field in batch order form',
    defaultMessage: 'Billing',
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

export const DashboardBatchOrderSubItems = ({ batchOrder }: { batchOrder: BatchOrderRead }) => {
  const intl = useIntl();

  const items = [
    <DashboardSubItem
      key="company"
      title={intl.formatMessage(messages.stepCompany)}
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
      title={intl.formatMessage(messages.stepAdmin)}
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
      key="signatory"
      title={intl.formatMessage(messages.stepSignatory)}
      footer={
        <div className="content">
          <DashboardItemField
            label={<FormattedMessage {...messages.labelName} />}
            value={`${batchOrder.signatory_firstname} ${batchOrder.signatory_lastname}`}
          />
          <DashboardItemField
            label={<FormattedMessage {...messages.labelProfession} />}
            value={batchOrder.signatory_profession}
          />
          <DashboardItemField
            label={<FormattedMessage {...messages.labelEmail} />}
            value={batchOrder.signatory_email}
          />
          <DashboardItemField
            label={<FormattedMessage {...messages.labelPhone} />}
            value={batchOrder.signatory_telephone}
          />
        </div>
      }
    />,
    <DashboardSubItem
      key="participants"
      title={intl.formatMessage(messages.stepParticipants)}
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
      title={intl.formatMessage(messages.stepFinancing)}
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
    items.push(
      <DashboardSubItem
        key="billing"
        title={intl.formatMessage(messages.labelBilling)}
        footer={
          <div className="content">
            <DashboardItemField
              label={<FormattedMessage {...messages.labelCompany} />}
              value={batchOrder.billing.company_name}
            />
            <DashboardItemField
              label={<FormattedMessage {...messages.labelSiret} />}
              value={batchOrder.billing.identification_number}
            />
            <DashboardItemField
              label={<FormattedMessage {...messages.labelName} />}
              value={batchOrder.billing.contact_name}
            />
            <DashboardItemField
              label={<FormattedMessage {...messages.labelEmail} />}
              value={batchOrder.billing.contact_email}
            />
            <DashboardItemField
              label={<FormattedMessage {...messages.labelAddress} />}
              value={batchOrder.billing.address}
            />
            <DashboardItemField
              label={<FormattedMessage {...messages.labelPostcode} />}
              value={batchOrder.billing.postcode}
            />
            <DashboardItemField
              label={<FormattedMessage {...messages.labelCity} />}
              value={batchOrder.billing.city}
            />
            <DashboardItemField
              label={<FormattedMessage {...messages.labelCountry} />}
              value={batchOrder.billing.country}
            />
          </div>
        }
      />,
    );
  }

  return <DashboardSubItemsList subItems={items} />;
};

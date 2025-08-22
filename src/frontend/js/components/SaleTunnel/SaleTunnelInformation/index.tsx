import { defineMessages, FormattedMessage, FormattedNumber, useIntl } from 'react-intl';
import { AddressSelector } from 'components/SaleTunnel/AddressSelector';
import { PaymentScheduleGrid } from 'components/PaymentScheduleGrid';
import { useSaleTunnelContext } from 'components/SaleTunnel/GenericSaleTunnel';
import OpenEdxFullNameForm from 'components/OpenEdxFullNameForm';
import { useSession } from 'contexts/SessionContext';
import useOpenEdxProfile from 'hooks/useOpenEdxProfile';
import { usePaymentSchedule } from 'hooks/usePaymentSchedule';
import { Spinner } from 'components/Spinner';
import WithdrawRightCheckbox from 'components/SaleTunnel/WithdrawRightCheckbox';
import { ProductType } from 'types/Joanie';
import { Select } from '@openfun/cunningham-react';
import { useState } from 'react';
import { SaleTunnelInformationGroup } from './SaleTunnelInformationGroup';

const messages = defineMessages({
  title: {
    id: 'components.SaleTunnel.Information.title',
    description: 'Title for the information section',
    defaultMessage: 'Information',
  },
  description: {
    id: 'components.SaleTunnel.Information.description',
    description: 'Description of the information section',
    defaultMessage: 'Those information will be used for billing',
  },
  fullNameLabel: {
    id: 'components.SaleTunnel.Information.fullNameLabel',
    description: 'Label for the full name input',
    defaultMessage: 'Full name',
  },
  paymentSchedule: {
    id: 'components.SaleTunnel.Information.paymentSchedule',
    description: 'Title for the payment schedule section',
    defaultMessage: 'Payment schedule',
  },
  totalInfo: {
    id: 'components.SaleTunnel.Information.total.info',
    description: 'Information about the total amount',
    defaultMessage: 'You will then pay on the secured platform of our payment provider.',
  },
  totalLabel: {
    id: 'components.SaleTunnel.Information.total.label',
    description: 'Label for the total amount',
    defaultMessage: 'Total',
  },
  emailLabel: {
    id: 'components.SaleTunnel.Information.email.label',
    description: 'Label for the email',
    defaultMessage: 'Account email',
  },
  emailInfo: {
    id: 'components.SaleTunnel.Information.email.info',
    description: 'Info for the email',
    defaultMessage:
      'This email will be used to send you confirmation mails, it is the one you created your account with.',
  },
  purchaseTypeTitle: {
    id: 'components.SaleTunnel.Information.purchaseTypeTitle',
    description: 'Title for purchase type',
    defaultMessage: 'Select purchase type',
  },
  purchaseTypeSelect: {
    id: 'components.SaleTunnel.Information.purchaseTypeSelect',
    description: 'Label for purchase type select',
    defaultMessage: 'Purchase type',
  },
  purchaseTypeOptionSingle: {
    id: 'components.SaleTunnel.Information.purchaseTypeOptionSingle',
    description: 'Label for B2C option',
    defaultMessage: 'Single purchase (B2C)',
  },
  purchaseTypeOptionGroup: {
    id: 'components.SaleTunnel.Information.purchaseTypeOptionGroup',
    description: 'Label for B2C option',
    defaultMessage: 'Group purchase (B2B)',
  },
});

export const SaleTunnelInformation = () => {
  const { product, setBatchOrder } = useSaleTunnelContext();
  const intl = useIntl();
  const options = [
    { label: intl.formatMessage(messages.purchaseTypeOptionSingle), value: 'b2c' },
    { label: intl.formatMessage(messages.purchaseTypeOptionGroup), value: 'b2b' },
  ];
  const [purchaseType, setPurchaseType] = useState('b2c');

  return (
    <div className="sale-tunnel__main__column sale-tunnel__information">
      <div>
        <h3 className="block-title mb-t">
          <FormattedMessage {...messages.purchaseTypeTitle} />
        </h3>
        <Select
          label={intl.formatMessage(messages.purchaseTypeSelect)}
          options={options}
          fullWidth
          value={purchaseType}
          clearable={false}
          onChange={(e) => {
            setPurchaseType(e.target.value as string);
            setBatchOrder(undefined);
          }}
        />
      </div>
      {purchaseType === 'b2c' && (
        <>
          <div>
            <h3 className="block-title mb-t">
              <FormattedMessage {...messages.title} />
            </h3>
            <div className="description mb-s">
              <FormattedMessage {...messages.description} />
            </div>
            <OpenEdxFullNameForm />
            <AddressSelector />
            <div className="mt-s">
              <Email />
            </div>
          </div>
          <div>
            {product.type === ProductType.CREDENTIAL && <PaymentScheduleBlock />}
            <Total />
            <WithdrawRightCheckbox />
          </div>
        </>
      )}
      {purchaseType === 'b2b' && <SaleTunnelInformationGroup />}
    </div>
  );
};
const Email = () => {
  const { user } = useSession();
  const { data: openEdxProfileData } = useOpenEdxProfile({
    username: user!.username,
  });

  return (
    <div className="sale-tunnel__email">
      <div className="sale-tunnel__email__top">
        <h4>
          <FormattedMessage {...messages.emailLabel} />
        </h4>
        <div className="fw-bold">{openEdxProfileData?.email}</div>
      </div>
      <div className="sale-tunnel__email__description">
        <FormattedMessage {...messages.emailInfo} />
      </div>
    </div>
  );
};

const Total = () => {
  const { product, offering, enrollment } = useSaleTunnelContext();
  const totalPrice =
    enrollment?.offerings?.[0]?.rules?.discounted_price ??
    offering?.rules.discounted_price ??
    product.price;
  return (
    <div className="sale-tunnel__total">
      <div className="sale-tunnel__total__amount mt-t" data-testid="sale-tunnel__total__amount">
        <div className="block-title">
          <FormattedMessage {...messages.totalLabel} />
        </div>
        <div className="block-title">
          <FormattedNumber value={totalPrice} style="currency" currency={product.price_currency} />
        </div>
      </div>
    </div>
  );
};

const PaymentScheduleBlock = () => {
  const { props } = useSaleTunnelContext();
  const query = usePaymentSchedule({
    course_code: props.course?.code || props.enrollment!.course_run.course.code,
    product_id: props.product.id,
  });

  if (!query.data || query.isLoading) {
    return <Spinner size="large" />;
  }

  return (
    <div className="payment-schedule">
      <h4 className="block-title mb-t">
        <FormattedMessage {...messages.paymentSchedule} />
      </h4>
      <div className="mt-t">
        <PaymentScheduleGrid schedule={query.data} />
      </div>
    </div>
  );
};

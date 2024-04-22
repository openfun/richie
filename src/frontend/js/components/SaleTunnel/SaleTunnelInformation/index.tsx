import { Alert, VariantType } from '@openfun/cunningham-react';
import { defineMessages, FormattedMessage, FormattedNumber } from 'react-intl';
import { AddressSelector } from 'components/SaleTunnel/AddressSelector';
import { CreditCardSelector } from 'components/SaleTunnel/CreditCardSelector';
import { PaymentScheduleGrid } from 'components/PaymentScheduleGrid';
import { useSaleTunnelContext } from 'components/SaleTunnel/GenericSaleTunnel';
import OpenEdxFullNameForm from 'components/OpenEdxFullNameForm';
import { useSession } from 'contexts/SessionContext';
import useOpenEdxProfile from 'hooks/useOpenEdxProfile';

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
});

export const SaleTunnelInformation = () => {
  return (
    <div className="sale-tunnel__information">
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
        <CreditCardSelector />
      </div>
      <div>
        <Total />
      </div>
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
  const { product } = useSaleTunnelContext();
  return (
    <div className="sale-tunnel__total">
      <Alert type={VariantType.INFO}>
        <FormattedMessage {...messages.totalInfo} />
      </Alert>
      <div className="sale-tunnel__total__amount mt-t" data-testid="sale-tunnel__total__amount">
        <div className="block-title">
          <FormattedMessage {...messages.totalLabel} />
        </div>
        <div className="block-title">
          <FormattedNumber
            value={product.price}
            style="currency"
            currency={product.price_currency}
          />
        </div>
      </div>
    </div>
  );
};

/**
 * Ready for V2.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const PaymentScheduleBlock = () => {
  return null;
  return (
    <div className="payment-schedule">
      <h4 className="block-title mb-t">Schedule</h4>
      <Alert type={VariantType.INFO}>
        The first payment occurs in 14 days, you will be notified to pay the first 30%.
      </Alert>
      <div className="mt-t">
        <PaymentScheduleGrid />
      </div>
    </div>
  );
};

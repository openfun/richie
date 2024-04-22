import { Alert, Input, VariantType } from '@openfun/cunningham-react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { AddressSelector } from 'components/SaleTunnel/AddressSelector';
import { CreditCardSelector } from 'components/SaleTunnel/CreditCardSelector';
import { PaymentScheduleGrid } from 'components/PaymentScheduleGrid';

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
});

export const SaleTunnelInformation = () => {
  const intl = useIntl();
  return (
    <div className="sale-tunnel__information">
      <div>
        <h3 className="block-title mb-t">
          <FormattedMessage {...messages.title} />
        </h3>
        <div className="description mb-s">
          <FormattedMessage {...messages.description} />
        </div>
        <Input label={intl.formatMessage(messages.fullNameLabel)} fullWidth={true} />
        <AddressSelector />
      </div>
      <div>
        <CreditCardSelector />
      </div>
      <div>
        <PaymentScheduleBlock />
      </div>
    </div>
  );
};

/**
 * Ready for V2.
 */
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

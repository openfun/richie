import { Checkbox } from '@openfun/cunningham-react';
import { useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { Product } from 'types/Joanie';
import context from 'utils/context';
import { PaymentErrorMessageId } from 'components/PaymentInterfaces/types';

const messages = defineMessages({
  termsMessage: {
    defaultMessage: 'By checking this box, you accept the ',
    description: 'Message next to the checkbox in order to accept the terms',
    id: 'components.PaymentButton.termsMessage',
  },
  termsMessageLink: {
    defaultMessage: 'General Terms of Sale',
    description: 'Clickable link included in the terms message',
    id: 'components.SaleTunnelStepPayment.termsMessageLink',
  },
  termsMessageLinkTitle: {
    defaultMessage: 'Open a preview of the General Terms of Sale',
    description: 'Title of clickable link included in the terms message',
    id: 'components.SaleTunnelStepPayment.termsMessageLinkTitle',
  },
});

export const useTerms = ({
  product,
  onError,
  error,
}: {
  product: Product;
  onError: (error: PaymentErrorMessageId) => void;
  error?: PaymentErrorMessageId;
}) => {
  const intl = useIntl();
  const [termsAccepted, setTermsAccepted] = useState(false);
  const validateTerms = () => {
    if (!product.contract_definition) {
      return;
    }
    if (!termsAccepted) {
      onError(PaymentErrorMessageId.ERROR_TERMS);
    }
  };

  return {
    termsAccepted: termsAccepted || !product.contract_definition,
    validateTerms,
    renderTermsCheckbox: () => {
      if (!product.contract_definition) {
        return null;
      }
      return (
        <section className="payment-button__terms">
          <Checkbox
            label={
              <>
                {intl.formatMessage(messages.termsMessage)}{' '}
                <a
                  href={context.site_urls.terms_and_conditions ?? '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={intl.formatMessage(messages.termsMessageLinkTitle)}
                >
                  {intl.formatMessage(messages.termsMessageLink)}
                </a>
              </>
            }
            onChange={(e) => setTermsAccepted(e.target.checked)}
            checked={termsAccepted}
            state={error === PaymentErrorMessageId.ERROR_TERMS ? 'error' : 'default'}
          />
        </section>
      );
    },
  };
};

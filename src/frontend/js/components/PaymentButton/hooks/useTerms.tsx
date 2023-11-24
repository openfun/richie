import { Checkbox } from '@openfun/cunningham-react';
import { useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { PaymentErrorMessageId } from 'components/PaymentButton/index';
import { Product } from 'types/Joanie';
import { useJoanieApi } from 'contexts/JoanieApiContext';

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
  const api = useJoanieApi();
  const [termsAccepted, setTermsAccepted] = useState(false);
  const validateTerms = () => {
    if (!product.contract_definition) {
      return;
    }
    if (!termsAccepted) {
      onError(PaymentErrorMessageId.ERROR_TERMS);
    }
  };

  const openContract = async (e: React.MouseEvent) => {
    if (!product.contract_definition) {
      return;
    }
    e.stopPropagation();
    e.preventDefault();
    const blob = await api.contractDefinitions.previewTemplate(product.contract_definition.id);
    // eslint-disable-next-line compat/compat
    const file = window.URL.createObjectURL(blob);
    window.open(file);
  };

  return {
    termsAccepted,
    validateTerms,
    renderTermsCheckbox: () => {
      return (
        <section className="payment-button__terms">
          <Checkbox
            label={
              <>
                {intl.formatMessage(messages.termsMessage)}{' '}
                <button
                  onClick={openContract}
                  title={intl.formatMessage(messages.termsMessageLinkTitle)}
                >
                  {intl.formatMessage(messages.termsMessageLink)}
                </button>
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

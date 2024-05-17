import {
  Alert,
  Button,
  Modal,
  ModalProps,
  ModalSize,
  VariantType,
} from '@openfun/cunningham-react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { useState } from 'react';
import { PaymentScheduleGrid } from 'components/PaymentScheduleGrid';
import { CreditCard } from 'types/Joanie';
import { CreditCardSelector } from 'components/CreditCardSelector';

const messages = defineMessages({
  title: {
    id: 'components.DashboardItemOrder.PaymentModal.title',
    defaultMessage: 'Payment details',
    description: 'Title of the payment modal',
  },
  scheduleTitle: {
    id: 'components.DashboardItemOrder.PaymentModal.scheduleTitle',
    defaultMessage: 'Repayment schedule',
    description: 'Title of the payment schedule',
  },
  paymentMethodTitle: {
    id: 'components.DashboardItemOrder.PaymentModal.paymentMethodTitle',
    defaultMessage: 'Payment method',
    description: 'Title of the payment method section',
  },
  paymentNeededMessage: {
    id: 'components.DashboardItemOrder.paymentNeededMessage',
    description: 'Message displayed when payment is needed',
    defaultMessage: 'The payment failed, please update your payment method',
  },
  paymentNeededButton: {
    id: 'components.DashboardItemOrder.paymentNeededButton',
    description: 'Button label for the payment needed message',
    defaultMessage: 'Pay {amount}',
  },
});

interface PaymentModalProps extends Pick<ModalProps, 'isOpen' | 'onClose'> {}

export const OrderPaymentDetailsModal = (props: PaymentModalProps) => {
  const intl = useIntl();
  const hasError = true;
  return (
    <Modal {...props} size={ModalSize.MEDIUM} title={intl.formatMessage(messages.title)}>
      <h3 className="order-payment-details__title mb-s">
        <FormattedMessage {...messages.paymentMethodTitle} />
      </h3>
      <CreditCardSelectorWrapper />
      <h3 className="order-payment-details__title mb-s mt-b">
        <FormattedMessage {...messages.scheduleTitle} />
      </h3>
      {hasError && (
        <Alert
          className="mb-t"
          type={VariantType.ERROR}
          buttons={
            <Button size="small">
              <FormattedMessage {...messages.paymentNeededButton} values={{ amount: '210,50€' }} />
            </Button>
          }
        >
          <FormattedMessage {...messages.paymentNeededMessage} />
        </Alert>
      )}
      <PaymentScheduleGrid />
    </Modal>
  );
};

const CreditCardSelectorWrapper = () => {
  const [creditCard, setCreditCard] = useState<CreditCard>();
  return (
    <CreditCardSelector creditCard={creditCard} setCreditCard={setCreditCard} quickRemove={false} />
  );
};

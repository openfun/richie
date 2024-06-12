import {
  Alert,
  Button,
  Modal,
  ModalProps,
  ModalSize,
  useModal,
  VariantType,
} from '@openfun/cunningham-react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { useState } from 'react';
import { PaymentScheduleGrid } from 'components/PaymentScheduleGrid';
import { CreditCard, Order } from 'types/Joanie';
import { CreditCardSelector } from 'components/CreditCardSelector';
import { OrderHelper } from 'utils/OrderHelper';
import { OrderPaymentRetryModal } from 'widgets/Dashboard/components/DashboardItem/Order/OrderPaymentRetryModal';

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

interface PaymentModalProps extends Pick<ModalProps, 'isOpen' | 'onClose'> {
  order: Order;
}

export const OrderPaymentDetailsModal = ({ order, ...props }: PaymentModalProps) => {
  const intl = useIntl();
  const retryModal = useModal();
  const failedInstallment = OrderHelper.getFailedInstallment(order);
  return (
    <>
      <Modal {...props} size={ModalSize.MEDIUM} title={intl.formatMessage(messages.title)}>
        <h3 className="order-payment-details__title mb-s">
          <FormattedMessage {...messages.paymentMethodTitle} />
        </h3>
        <CreditCardSelectorWrapper />
        <h3 className="order-payment-details__title mb-s mt-b">
          <FormattedMessage {...messages.scheduleTitle} />
        </h3>
        {failedInstallment && (
          <Alert
            className="mb-t"
            type={VariantType.ERROR}
            buttons={
              <Button size="small" onClick={retryModal.open}>
                <FormattedMessage
                  {...messages.paymentNeededButton}
                  values={{
                    amount: intl.formatNumber(failedInstallment.amount, {
                      style: 'currency',
                      currency: failedInstallment.currency,
                    }),
                  }}
                />
              </Button>
            }
          >
            <FormattedMessage {...messages.paymentNeededMessage} />
          </Alert>
        )}
        {order.payment_schedule && <PaymentScheduleGrid schedule={order.payment_schedule} />}
      </Modal>
      {failedInstallment && (
        <OrderPaymentRetryModal {...retryModal} installment={failedInstallment} order={order} />
      )}
    </>
  );
};

const CreditCardSelectorWrapper = () => {
  // TODO: At the moment is automatically selects the default credit card but it must select the credit card used to
  // buy the order.
  const [creditCard, setCreditCard] = useState<CreditCard>();
  return (
    <CreditCardSelector
      creditCard={creditCard}
      setCreditCard={setCreditCard}
      quickRemove={false}
      allowEdit={false}
    />
  );
};

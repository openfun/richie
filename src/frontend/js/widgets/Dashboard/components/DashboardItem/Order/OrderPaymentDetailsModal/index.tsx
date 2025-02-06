import {
  Alert,
  Button,
  Loader,
  Modal,
  ModalProps,
  ModalSize,
  useModal,
  VariantType,
} from '@openfun/cunningham-react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { useState, useEffect } from 'react';
import { PaymentScheduleGrid } from 'components/PaymentScheduleGrid';
import { ACTIVE_ORDER_STATES, CreditCard, Order, OrderState } from 'types/Joanie';
import { CreditCardSelector } from 'components/CreditCardSelector';
import { OrderPaymentRetryModal } from 'widgets/Dashboard/components/DashboardItem/Order/OrderPaymentRetryModal';
import { Maybe } from 'types/utils';
import { useCreditCard } from 'hooks/useCreditCards';
import PaymentScheduleHelper from 'utils/PaymentScheduleHelper';

const messages = defineMessages({
  title: {
    id: 'components.DashboardItemOrder.PaymentModal.title',
    defaultMessage: 'Payment details',
    description: 'Title of the payment modal',
  },
  scheduleTitle: {
    id: 'components.DashboardItemOrder.PaymentModal.scheduleTitle',
    defaultMessage: 'Payment schedule',
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
  const failedInstallment = PaymentScheduleHelper.getFailedInstallment(order.payment_schedule);
  const showPaymentMethod = ACTIVE_ORDER_STATES.filter<OrderState>(
    (state) => state !== OrderState.COMPLETED,
  ).includes(order.state);

  return (
    <>
      <Modal {...props} size={ModalSize.MEDIUM} title={intl.formatMessage(messages.title)}>
        {showPaymentMethod && (
          <>
            <h3 className="order-payment-details__title mb-s">
              <FormattedMessage {...messages.paymentMethodTitle} />
            </h3>
            <CreditCardSelectorWrapper selectedCreditCardId={order.credit_card_id} />
          </>
        )}
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

const CreditCardSelectorWrapper = ({
  selectedCreditCardId,
}: {
  selectedCreditCardId: Maybe<string>;
}) => {
  const {
    item: creditCard,
    states: { fetching },
  } = useCreditCard(selectedCreditCardId);
  const [selectedCreditCard, setSelectedCreditCard] = useState<Maybe<CreditCard>>(creditCard);

  useEffect(() => {
    if (!selectedCreditCard && creditCard) {
      setSelectedCreditCard(creditCard);
    }
  }, [creditCard]);

  if (fetching) {
    return <Loader size="small" />;
  }

  return (
    <CreditCardSelector
      creditCard={selectedCreditCard || creditCard}
      setCreditCard={setSelectedCreditCard}
      quickRemove={false}
      allowEdit={false}
    />
  );
};

import {
  Alert,
  Button,
  Modal,
  ModalProps,
  ModalSize,
  useModals,
  VariantType,
} from '@openfun/cunningham-react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { useRef, useState } from 'react';
import {
  CreditCard,
  Order,
  OrderEnrollment,
  PaymentInstallment,
  ACTIVE_ORDER_STATES,
} from 'types/Joanie';
import { CreditCardSelector } from 'components/CreditCardSelector';
import { useJoanieApi } from 'contexts/JoanieApiContext';
import { Payment, PaymentErrorMessageId } from 'components/PaymentInterfaces/types';
import PaymentInterface from 'components/PaymentInterfaces';
import { PAYMENT_SETTINGS } from 'settings';
import { useOrders } from 'hooks/useOrders';
import { Spinner } from 'components/Spinner';

const messages = defineMessages({
  title: {
    id: 'components.DashboardItemOrder.OrderPaymentRetryModal.title',
    defaultMessage: 'Retry payment',
    description: 'Title of the payment retry modal',
  },
  description: {
    id: 'components.DashboardItemOrder.OrderPaymentRetryModal.description',
    defaultMessage:
      'The payment failed, please choose another payment method or add a new one during the payment',
    description: 'Message displayed when payment is needed',
  },
  submit: {
    id: 'components.DashboardItemOrder.OrderPaymentRetryModal.submit',
    defaultMessage: 'Pay {amount}',
    description: 'Message displayed when payment is needed',
  },
  paymentInProgress: {
    defaultMessage: 'Payment in progress',
    description: 'Label for screen reader when a retry payment is in progress.',
    id: 'components.DashboardItemOrder.OrderPaymentRetryModal.paymentInProgress',
  },
  successTitle: {
    defaultMessage: 'Payment successful',
    description: 'Title of the payment success modal',
    id: 'components.DashboardItemOrder.OrderPaymentRetryModal.successTitle',
  },
  successDescription: {
    defaultMessage: 'The payment was successful',
    description: 'Description of the payment success modal',
    id: 'components.DashboardItemOrder.OrderPaymentRetryModal.successDescription',
  },
  errorFailedSubmitInstallmentPayment: {
    defaultMessage: 'Failed to submit installment payment, please retry later.',
    description: 'Error message when submitting installment payment fails',
    id: 'components.DashboardItemOrder.OrderPaymentRetryModal.errorFailedSubmitInstallmentPayment',
  },
  errorAbortingPolling: {
    defaultMessage:
      'Your payment has succeeded but your order validation is taking too long, you can close this dialog and come back later.',
    description: 'Error message when submitting installment payment fails',
    id: 'components.DashboardItemOrder.OrderPaymentRetryModal.errorAbortingPolling',
  },
});

interface Props extends Pick<ModalProps, 'isOpen' | 'onClose'> {
  installment: PaymentInstallment;
  order: Order | OrderEnrollment;
}

enum ComponentStates {
  IDLE = 'idle',
  LOADING = 'loading',
  ERROR = 'error',
}

export const OrderPaymentRetryModal = ({ installment, order, ...props }: Props) => {
  const intl = useIntl();
  const API = useJoanieApi();
  const timeoutRef = useRef<NodeJS.Timeout>(undefined);
  const { methods: orderMethods } = useOrders(undefined, { enabled: false });
  const [payment, setPayment] = useState<Payment>();
  const [state, setState] = useState<ComponentStates>(ComponentStates.IDLE);
  const [error, setError] = useState<string>();
  const [creditCard, setCreditCard] = useState<CreditCard>();
  const modals = useModals();

  const pay = async () => {
    setState(ComponentStates.LOADING);
    try {
      const paymentResponse = await API.user.orders.submit_installment_payment(order.id, {
        credit_card_id: creditCard?.id,
      });
      if (paymentResponse) {
        setPayment(paymentResponse);
      } else {
        // In case of bug.
        setError(intl.formatMessage(messages.errorFailedSubmitInstallmentPayment));
        setState(ComponentStates.ERROR);
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_error) {
      setError(intl.formatMessage(messages.errorFailedSubmitInstallmentPayment));
      setState(ComponentStates.ERROR);
    }
  };

  const handleError = (messageId: string = PaymentErrorMessageId.ERROR_DEFAULT) => {
    setState(ComponentStates.ERROR);
    setError(messageId);
  };

  const isOrderValidated = async (id: string): Promise<Boolean> => {
    const orderToCheck = await API.user.orders.get({ id });
    return orderToCheck !== null && ACTIVE_ORDER_STATES.includes(orderToCheck.state);
  };

  const settled = async () => {
    await orderMethods.invalidate();
    props.onClose();
    await modals.messageModal({
      messageType: VariantType.SUCCESS,
      title: intl.formatMessage(messages.successTitle),
      children: intl.formatMessage(messages.successDescription),
    });
  };

  const handleSuccess = () => {
    let round = 0;

    const checkOrderValidity = async () => {
      if (round >= PAYMENT_SETTINGS.pollLimit) {
        timeoutRef.current = undefined;
        setState(ComponentStates.ERROR);
        setError(intl.formatMessage(messages.errorAbortingPolling));
      } else {
        const isValidated = await isOrderValidated(order.id);
        if (isValidated) {
          setState(ComponentStates.IDLE);
          timeoutRef.current = undefined;
          settled();
        } else {
          round++;
          timeoutRef.current = setTimeout(checkOrderValidity, PAYMENT_SETTINGS.pollInterval);
        }
      }
    };

    checkOrderValidity();
  };

  return (
    <>
      <Modal
        {...props}
        size={ModalSize.MEDIUM}
        title={intl.formatMessage(messages.title)}
        closeOnEsc={state !== ComponentStates.LOADING}
        preventClose={state === ComponentStates.LOADING}
        hideCloseButton={state === ComponentStates.LOADING}
        actions={
          <Button
            color="primary"
            size="small"
            fullWidth={true}
            onClick={pay}
            disabled={state === ComponentStates.LOADING}
            data-testid="order-payment-retry-modal-submit-button"
          >
            {state === ComponentStates.LOADING ? (
              <Spinner theme="light" aria-labelledby="payment-in-progress">
                <span id="payment-in-progress">
                  <FormattedMessage {...messages.paymentInProgress} />
                </span>
              </Spinner>
            ) : (
              <FormattedMessage
                {...messages.submit}
                values={{
                  amount: intl.formatNumber(installment.amount, {
                    style: 'currency',
                    currency: installment.currency,
                  }),
                }}
              />
            )}
          </Button>
        }
      >
        {error && (
          <Alert type={VariantType.ERROR} className="mb-t">
            {error}
          </Alert>
        )}
        <Alert className="mb-b">
          <FormattedMessage {...messages.description} />
        </Alert>
        <CreditCardSelector
          creditCard={creditCard}
          setCreditCard={setCreditCard}
          quickRemove={state !== ComponentStates.LOADING}
          allowEdit={state !== ComponentStates.LOADING}
        />
      </Modal>
      {state === ComponentStates.LOADING && payment && (
        <PaymentInterface {...payment} onError={handleError} onSuccess={handleSuccess} />
      )}
    </>
  );
};

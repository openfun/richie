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
import { BatchOrderRead, BatchOrderState } from 'types/Joanie';
import { useJoanieApi } from 'contexts/JoanieApiContext';
import { Payment, PaymentErrorMessageId } from 'components/PaymentInterfaces/types';
import PaymentInterface from 'components/PaymentInterfaces';
import { PAYMENT_SETTINGS } from 'settings';
import { Spinner } from 'components/Spinner';
import { useBatchOrders, useBatchOrdersActions } from 'hooks/useBatchOrder';

const messages = defineMessages({
  title: {
    id: 'components.DashboardItemBatchOrder.BatchOrderPaymentModal.title',
    defaultMessage: 'Batch order payment',
    description: 'Title of the modal prompting the user to complete a batch order payment.',
  },
  description: {
    id: 'components.DashboardItemBatchOrder.BatchOrderPaymentModal.description',
    defaultMessage:
      'Since you selected payment by credit card, please finalize your batch order to complete the process.',
    description:
      'Informational message displayed when the user needs to complete the batch order payment.',
  },
  submit: {
    id: 'components.DashboardItemBatchOrder.BatchOrderPaymentModal.submit',
    defaultMessage: 'Pay {amount}',
    description: 'Label of the button used to start the batch order payment.',
  },
  paymentInProgress: {
    id: 'components.DashboardItemBatchOrder.BatchOrderPaymentModal.paymentInProgress',
    defaultMessage: 'Payment in progress',
    description: 'Label displayed when the payment process is currently ongoing.',
  },
  paymentError: {
    id: 'components.DashboardItemBatchOrder.BatchOrderPaymentModal.paymentError',
    defaultMessage: 'An error occurred during the payment process.',
    description: 'Error message displayed when the payment fails.',
  },
  successTitle: {
    id: 'components.DashboardItemBatchOrder.BatchOrderPaymentModal.successTitle',
    defaultMessage: 'Payment successful',
    description: 'Title of the modal displayed when the payment completes successfully.',
  },
  successDescription: {
    id: 'components.DashboardItemBatchOrder.BatchOrderPaymentModal.successDescription',
    defaultMessage: 'Your payment has been processed successfully.',
    description: 'Description displayed in the success modal after a successful payment.',
  },
  abortError: {
    id: 'components.DashboardItemBatchOrder.BatchOrderPaymentModal.abortError',
    defaultMessage: 'Your payment was aborted during the process. Please try again.',
    description:
      'Error message displayed when the payment process is aborted by the user or system.',
  },
  errorAbortingPolling: {
    id: 'components.DashboardItemBatchOrder.BatchOrderPaymentModal.errorAbortingPolling',
    defaultMessage:
      'Your payment was successful, but order validation is taking longer than expected. You can close this dialog and check your order later.',
    description:
      'Message displayed when the payment succeeded but the order validation polling timed out.',
  },
});

interface Props extends Pick<ModalProps, 'isOpen' | 'onClose'> {
  batchOrder: BatchOrderRead;
}

enum ComponentStates {
  IDLE = 'idle',
  LOADING = 'loading',
  ERROR = 'error',
}

export const BatchOrderPaymentModal = ({ batchOrder, ...props }: Props) => {
  const intl = useIntl();
  const API = useJoanieApi();
  const timeoutRef = useRef<NodeJS.Timeout>(undefined);
  const { methods: batchOrderMethods } = useBatchOrders();
  const [payment, setPayment] = useState<Payment>();
  const [state, setState] = useState<ComponentStates>(ComponentStates.IDLE);
  const [error, setError] = useState<string>();

  const modals = useModals();
  const { submitForPayment } = useBatchOrdersActions();
  const pay = async () => {
    setState(ComponentStates.LOADING);
    try {
      const paymentResponse = await submitForPayment({
        id: batchOrder.id,
      });

      if (paymentResponse) {
        setPayment(paymentResponse);
      } else {
        // In case of bug.
        setError(intl.formatMessage(messages.paymentError));
        setState(ComponentStates.ERROR);
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_error) {
      setError(intl.formatMessage(messages.paymentError));
      setState(ComponentStates.ERROR);
    }
  };

  const handleError = (messageId: string = PaymentErrorMessageId.ERROR_DEFAULT) => {
    setState(ComponentStates.ERROR);

    if (messageId === PaymentErrorMessageId.ERROR_ABORT) {
      setError(intl.formatMessage(messages.abortError));
    } else {
      setError(intl.formatMessage(messages.paymentError));
    }
  };

  const isBatchOrderValidated = async (id: string): Promise<Boolean> => {
    const batchOrderToCheck = await API.user.batchOrders.get({ id });
    return batchOrderToCheck !== null && batchOrderToCheck.state === BatchOrderState.COMPLETED;
  };

  const settled = async () => {
    await batchOrderMethods.invalidate();
    props.onClose();
    await modals.messageModal({
      messageType: VariantType.SUCCESS,
      title: intl.formatMessage(messages.successTitle),
      children: intl.formatMessage(messages.successDescription),
    });
  };

  const handleSuccess = () => {
    let round = 0;

    const checkBatchOrderValidity = async () => {
      if (round >= PAYMENT_SETTINGS.pollLimit) {
        timeoutRef.current = undefined;
        setState(ComponentStates.ERROR);
        setError(intl.formatMessage(messages.errorAbortingPolling));
      } else {
        const isValidated = await isBatchOrderValidated(batchOrder.id);
        if (isValidated) {
          setState(ComponentStates.IDLE);
          timeoutRef.current = undefined;
          settled();
        } else {
          round++;
          timeoutRef.current = setTimeout(checkBatchOrderValidity, PAYMENT_SETTINGS.pollInterval);
        }
      }
    };

    checkBatchOrderValidity();
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
                  amount: intl.formatNumber(batchOrder.total ?? 0, {
                    style: 'currency',
                    currency: batchOrder.currency ?? 'EUR',
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
        {!error && (
          <Alert className="mb-b">
            <FormattedMessage {...messages.description} />
          </Alert>
        )}
      </Modal>
      {payment && <PaymentInterface {...payment} onError={handleError} onSuccess={handleSuccess} />}
    </>
  );
};

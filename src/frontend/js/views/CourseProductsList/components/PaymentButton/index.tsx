import { useEffect, useMemo, useRef, useState } from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import PaymentInterface from 'components/PaymentInterfaces';
import { Spinner } from 'components/Spinner';
import { useCourseCode } from 'data/CourseCodeProvider';
import { useJoanieApi } from 'data/JoanieApiProvider';
import { useOrders } from 'hooks/useOrders';
import { PAYMENT_SETTINGS } from 'settings';
import type * as Joanie from 'types/Joanie';
import { OrderState } from 'types/Joanie';
import type { Nullable } from 'types/utils';

const messages = defineMessages({
  errorAbort: {
    defaultMessage: 'You have aborted the payment.',
    description: 'Error message shown when user aborts the payment.',
    id: 'components.PaymentButton.errorAbort',
  },
  errorAborting: {
    defaultMessage: 'Aborting the payment...',
    description: 'Error message shown when user asks to abort the payment.',
    id: 'components.PaymentButton.errorAborting',
  },
  errorDefault: {
    defaultMessage: 'An error occurred during payment. Please retry later.',
    description: 'Error message shown when payment creation request failed.',
    id: 'components.PaymentButton.errorDefault',
  },
  pay: {
    defaultMessage: 'Pay {price}',
    description: 'CTA label to proceed to the payment of the product',
    id: 'components.PaymentButton.pay',
  },
  payInOneClick: {
    defaultMessage: 'Pay in one click {price}',
    description: 'CTA label to proceed to the one click payment of the product',
    id: 'components.PaymentButton.payInOneClick',
  },
  paymentInProgress: {
    defaultMessage: 'Payment in progress',
    description: 'Label for screen reader when a payment is in progress.',
    id: 'components.PaymentButton.paymentInProgress',
  },
});

export enum PaymentErrorMessageId {
  ERROR_ABORT = 'errorAbort',
  ERROR_ABORTING = 'errorAborting',
  ERROR_DEFAULT = 'errorDefault',
}

interface PaymentButtonProps {
  product: Joanie.Product;
  billingAddress?: Joanie.Address;
  creditCard?: Nullable<Joanie.CreditCard['id']>;
  onSuccess: () => void;
}

type PaymentInfo = Joanie.Payment & { order_id: string };
type OneClickPaymentInfo = Joanie.PaymentOneClick & { order_id: string };

enum ComponentStates {
  IDLE = 'idle',
  LOADING = 'loading',
  ERROR = 'error',
}

/**
 * Displays a button to proceed to the payment.
 * First it creates the payment from Joanie then displays the payment interface
 * or the error message.
 */
const PaymentButton = ({ product, billingAddress, creditCard, onSuccess }: PaymentButtonProps) => {
  const intl = useIntl();
  const API = useJoanieApi();
  const timeoutRef = useRef<NodeJS.Timeout>();
  const courseCode = useCourseCode();
  const orderManager = useOrders();

  const isReadyToPay = useMemo(() => {
    return courseCode && product.id && billingAddress;
  }, [product, courseCode, billingAddress]);

  const [payment, setPayment] = useState<PaymentInfo | OneClickPaymentInfo>();
  const [state, setState] = useState<ComponentStates>(ComponentStates.IDLE);
  const [error, setError] = useState<PaymentErrorMessageId>(PaymentErrorMessageId.ERROR_DEFAULT);

  /**
   * Use Joanie API to retrieve an order and check if it's state is validated
   *
   * @param {string} id - Order id
   * @returns {Promise<boolean>} - Promise resolving to true if order is validated
   */
  const isOrderValidated = async (id: string): Promise<Boolean> => {
    const order = await API.user.orders.get(id);
    return order?.state === OrderState.VALIDATED;
  };

  /** type guard to check if the payment is a payment one click */
  const isOneClickPayment = (p: typeof payment): p is OneClickPaymentInfo =>
    (p as OneClickPaymentInfo)?.is_paid === true;

  const createPayment = async () => {
    if (isReadyToPay) {
      setState(ComponentStates.LOADING);
      let paymentInfos = payment;

      if (!paymentInfos) {
        try {
          const order = await orderManager.methods.create({
            billing_address: billingAddress!,
            ...(creditCard && { credit_card_id: creditCard }),
            course: courseCode,
            product: product.id,
          });
          paymentInfos = {
            ...order.payment_info!,
            order_id: order.id,
          };
        } catch {
          setState(ComponentStates.ERROR);
        }
      }

      setPayment(paymentInfos);
    }
  };

  const handleSuccess = () => {
    let round = 0;

    const checkOrderValidity = async () => {
      if (round >= PAYMENT_SETTINGS.pollLimit) {
        timeoutRef.current = undefined;
        orderManager.methods.abort({ id: payment!.order_id, payment_id: payment!.payment_id });
        setState(ComponentStates.ERROR);
      } else {
        const isValidated = await isOrderValidated(payment!.order_id);
        if (isValidated) {
          setState(ComponentStates.IDLE);
          timeoutRef.current = undefined;
          onSuccess();
        } else {
          round++;
          timeoutRef.current = setTimeout(checkOrderValidity, PAYMENT_SETTINGS.pollInterval);
        }
      }
    };

    checkOrderValidity();
  };

  const handleError = (messageId: PaymentErrorMessageId = PaymentErrorMessageId.ERROR_DEFAULT) => {
    setState(ComponentStates.ERROR);
    setError(messageId);
  };

  useEffect(() => {
    if (isOneClickPayment(payment) && state === ComponentStates.LOADING) {
      handleSuccess();
    }

    return () => {
      if (timeoutRef.current !== undefined) {
        clearTimeout(timeoutRef.current);
        if (payment) {
          orderManager.methods.abort({
            id: payment.order_id,
            payment_id: payment.payment_id,
          });
        }
      }
    };
  }, [payment]);

  useEffect(() => {
    if (error === PaymentErrorMessageId.ERROR_ABORTING) {
      orderManager.methods
        .abort({
          id: payment!.order_id,
          payment_id: payment!.payment_id,
        })
        .then(() => {
          setPayment(undefined);
          handleError(PaymentErrorMessageId.ERROR_ABORT);
        });
    }
  }, [error]);

  return (
    <div className="payment-button">
      <button
        className="button button-sale--primary"
        disabled={!isReadyToPay || state === ComponentStates.LOADING}
        onClick={createPayment}
      >
        {state === ComponentStates.LOADING ? (
          <Spinner theme="light" aria-labelledby="payment-in-progress">
            <span id="payment-in-progress">
              <FormattedMessage {...messages.paymentInProgress} />
            </span>
          </Spinner>
        ) : (
          <FormattedMessage
            {...(creditCard ? messages.payInOneClick : messages.pay)}
            values={{
              price: intl.formatNumber(product.price, {
                style: 'currency',
                currency: product.price_currency,
              }),
            }}
          />
        )}
      </button>
      {state === ComponentStates.LOADING && payment && !isOneClickPayment(payment) && (
        <PaymentInterface {...payment} onError={handleError} onSuccess={handleSuccess} />
      )}
      {state === ComponentStates.ERROR && (
        <p className="payment-button__error">
          <FormattedMessage {...messages[error]} />
        </p>
      )}
    </div>
  );
};

export default PaymentButton;

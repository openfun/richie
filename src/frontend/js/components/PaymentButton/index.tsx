import { useEffect, useMemo, useRef, useState } from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { Button } from '@openfun/cunningham-react';
import { Spinner } from 'components/Spinner';
import { useJoanieApi } from 'contexts/JoanieApiContext';
import { PAYMENT_SETTINGS } from 'settings';
import type * as Joanie from 'types/Joanie';
import { OrderCreationPayload, OrderState, ProductType } from 'types/Joanie';
import type { Nullable } from 'types/utils';
import { HttpError } from 'utils/errors/HttpError';
import WebAnalyticsAPIHandler from 'api/web-analytics';
import { CourseProductEvent } from 'types/web-analytics';
import { useTerms } from 'components/PaymentButton/hooks/useTerms';
import { useSaleTunnelContext } from 'components/SaleTunnel/context';
import { ObjectHelper } from 'utils/ObjectHelper';
import { useOrders } from 'hooks/useOrders';
import PaymentInterface from './components/PaymentInterfaces';

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
  errorFullProduct: {
    defaultMessage: 'There are no more places available for this product.',
    description:
      'Error message shown when payment creation request failed because there is no remaining available seat for the product.',
    id: 'components.PaymentButton.errorFullProduct',
  },
  errorAddress: {
    defaultMessage: 'You must have a billing address.',
    description: "Error message shown when the user didn't select a billing address.",
    id: 'components.PaymentButton.errorAddress',
  },
  errorTerms: {
    defaultMessage: 'You must accept the terms.',
    description: "Error message shown when the user didn't check the terms checkbox.",
    id: 'components.PaymentButton.errorTerms',
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
  ERROR_ADDRESS = 'errorAddress',
  ERROR_DEFAULT = 'errorDefault',
  ERROR_FULL_PRODUCT = 'errorFullProduct',
  ERROR_TERMS = 'errorTerms',
}

interface PaymentButtonProps {
  billingAddress?: Joanie.Address;
  creditCard?: Nullable<Joanie.CreditCard['id']>;
  onSuccess: () => void;
}

type PaymentInfo = Joanie.Payment & { order_id: string };
export type OneClickPaymentInfo = Joanie.PaymentOneClick & { order_id: string };

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
const PaymentButton = ({ billingAddress, creditCard, onSuccess }: PaymentButtonProps) => {
  const intl = useIntl();
  const API = useJoanieApi();
  const timeoutRef = useRef<NodeJS.Timeout>();
  const { course, key, enrollment, product, order, orderGroup } = useSaleTunnelContext();
  const { methods: orderMethods } = useOrders(undefined, { enabled: false });
  const [payment, setPayment] = useState<PaymentInfo | OneClickPaymentInfo>();
  const [state, setState] = useState<ComponentStates>(ComponentStates.IDLE);
  const [error, setError] = useState<PaymentErrorMessageId>(PaymentErrorMessageId.ERROR_DEFAULT);

  const { validateTerms, termsAccepted, renderTermsCheckbox } = useTerms({
    product,
    error,
    onError: (e) => {
      setError(e);
      setState(ComponentStates.ERROR);
    },
  });

  const isReadyToPay = useMemo(() => {
    return (course || enrollment) && product && billingAddress && termsAccepted;
  }, [product, course, enrollment, billingAddress, termsAccepted]);

  /**
   * Use Joanie API to retrieve an order and check if it's state is validated
   *
   * @param {string} id - Order id
   * @returns {Promise<boolean>} - Promise resolving to true if order is validated
   */
  const isOrderValidated = async (id: string): Promise<Boolean> => {
    const orderToCheck = await API.user.orders.get({ id });
    return orderToCheck?.state === OrderState.VALIDATED;
  };

  const createPayment = async (orderId: string) => {
    WebAnalyticsAPIHandler()?.sendCourseProductEvent(CourseProductEvent.PAYMENT_CREATION, key);

    if (!billingAddress) {
      setError(PaymentErrorMessageId.ERROR_ADDRESS);
      setState(ComponentStates.ERROR);
    }

    validateTerms();

    if (isReadyToPay) {
      setState(ComponentStates.LOADING);
      let paymentInfos = payment;

      if (!paymentInfos) {
        const billingAddressPayload = ObjectHelper.omit(billingAddress!, 'id', 'is_main');

        orderMethods.submit(
          {
            id: orderId,
            billing_address: billingAddressPayload,
            ...(creditCard && { credit_card_id: creditCard }),
          },
          {
            onSuccess: (orderPayment) => {
              paymentInfos = {
                ...orderPayment.payment_info,
                order_id: orderId,
              };
              setPayment(paymentInfos);
            },
            onError: async (createPaymentError: HttpError) => {
              if (createPaymentError.responseBody) {
                const responseErrors = await createPaymentError.responseBody;
                if ('max_validated_orders' in responseErrors) {
                  setError(PaymentErrorMessageId.ERROR_FULL_PRODUCT);
                }
              }
              setState(ComponentStates.ERROR);
            },
          },
        );
      }
    }
  };

  const createOrder = async () => {
    if (!billingAddress) {
      setError(PaymentErrorMessageId.ERROR_ADDRESS);
      setState(ComponentStates.ERROR);
    }

    validateTerms();

    if (!isReadyToPay) {
      return;
    }

    setState(ComponentStates.LOADING);

    if (order) {
      createPayment(order.id);
    } else {
      const payload: OrderCreationPayload =
        product.type === ProductType.CERTIFICATE
          ? {
              product_id: product.id,
              enrollment_id: enrollment!.id,
              has_consent_to_terms: termsAccepted,
            }
          : {
              product_id: product.id,
              course_code: course!.code,
              has_consent_to_terms: termsAccepted,
              ...(orderGroup ? { order_group_id: orderGroup.id } : {}),
            };

      orderMethods.create(payload, {
        onSuccess: (newOrder) => {
          createPayment(newOrder.id);
        },
        onError: async () => {
          setState(ComponentStates.ERROR);
        },
      });
    }
  };

  const handleSuccess = () => {
    let round = 0;

    const checkOrderValidity = async () => {
      if (round >= PAYMENT_SETTINGS.pollLimit) {
        timeoutRef.current = undefined;
        orderMethods.abort({ id: payment!.order_id, payment_id: payment!.payment_id });
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
    return () => {
      if (timeoutRef.current !== undefined) {
        clearTimeout(timeoutRef.current);
        if (payment) {
          orderMethods.abort({
            id: payment.order_id,
            payment_id: payment.payment_id,
          });
        }
      }
    };
  }, [payment]);

  useEffect(() => {
    if (error === PaymentErrorMessageId.ERROR_ABORTING) {
      orderMethods
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

  useEffect(() => {
    if (state === ComponentStates.ERROR) {
      document.querySelector<HTMLElement>('#sale-tunnel-payment-error')?.focus();
    }
  }, [state]);

  return (
    <div className="payment-button" data-testid={order && 'payment-button-order-loaded'}>
      {renderTermsCheckbox()}
      <Button
        disabled={state === ComponentStates.LOADING}
        onClick={createOrder}
        {...(state === ComponentStates.ERROR && {
          'aria-describedby': 'sale-tunnel-payment-error',
        })}
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
      </Button>
      {state === ComponentStates.LOADING && payment && (
        <PaymentInterface {...payment} onError={handleError} onSuccess={handleSuccess} />
      )}
      <p className="payment-button__error" id="sale-tunnel-payment-error" tabIndex={-1}>
        {state === ComponentStates.ERROR && <FormattedMessage {...messages[error]} />}
      </p>
    </div>
  );
};

export default PaymentButton;

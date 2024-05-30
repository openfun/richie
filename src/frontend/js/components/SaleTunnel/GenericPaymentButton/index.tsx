import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@openfun/cunningham-react';
import { useJoanieApi } from 'contexts/JoanieApiContext';
import { useSaleTunnelContext } from 'components/SaleTunnel/GenericSaleTunnel';
import { useOrders } from 'hooks/useOrders';
import { OrderCreationPayload, OrderState } from 'types/Joanie';
import type { Maybe } from 'types/utils';
import { useTerms } from 'components/SaleTunnel/hooks/useTerms';
import WebAnalyticsAPIHandler from 'api/web-analytics';
import { CourseProductEvent } from 'types/web-analytics';
import { ObjectHelper } from 'utils/ObjectHelper';
import { HttpError } from 'utils/errors/HttpError';
import { PAYMENT_SETTINGS } from 'settings';
import { Spinner } from 'components/Spinner';
import PaymentInterface from 'components/PaymentInterfaces';
import { useMatchMediaLg } from 'hooks/useMatchMedia';
import { PaymentErrorMessageId, Payment, PaymentWithId } from 'components/PaymentInterfaces/types';

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

type PaymentInfo = Payment & { order_id: string };

enum ComponentStates {
  IDLE = 'idle',
  LOADING = 'loading',
  ERROR = 'error',
}

interface Props {
  buildOrderPayload: (
    payload: Pick<OrderCreationPayload, 'product_id' | 'has_consent_to_terms'>,
  ) => OrderCreationPayload;
}

export const GenericPaymentButton = ({ buildOrderPayload }: Props) => {
  const intl = useIntl();
  const API = useJoanieApi();
  const timeoutRef = useRef<NodeJS.Timeout>();
  const {
    webAnalyticsEventKey,
    order,
    billingAddress,
    creditCard,
    product,
    onPaymentSuccess,
    props: saleTunnelProps,
    runSubmitCallbacks,
  } = useSaleTunnelContext();
  const { methods: orderMethods } = useOrders(undefined, { enabled: false });
  const [payment, setPayment] = useState<PaymentInfo>();
  const [state, setState] = useState<ComponentStates>(ComponentStates.IDLE);
  const [error, setError] = useState<PaymentErrorMessageId>();
  const hasPaymentId = (p: Maybe<Payment>): p is Extract<Payment, PaymentWithId> => {
    return Boolean(p?.hasOwnProperty('payment_id'));
  };
  const paymentId = hasPaymentId(payment) ? payment.payment_id : undefined;
  const isMobile = useMatchMediaLg();

  // This pattern is ugly but I couldn't find a better way to achieve it in a nicer way.
  // Without this, when we call onPaymentSuccess() directly from the after polling function,
  // it is not the latest version of the function, so the value of `order` inside the context function (defined in GenericSaleTunnel.tsx)
  // will be undefined, then calling onFinish(order) with an undefined order.
  const onPaymentSuccessRef = useRef(onPaymentSuccess);
  onPaymentSuccessRef.current = onPaymentSuccess;

  const { validateTerms, termsAccepted, renderTermsCheckbox } = useTerms({
    product,
    error,
    onError: (e) => {
      handleError(e);
    },
  });

  const isReadyToPay = useMemo(() => {
    return (
      (saleTunnelProps.course || saleTunnelProps.enrollment) &&
      product &&
      billingAddress &&
      termsAccepted
    );
  }, [product, saleTunnelProps.course, saleTunnelProps.enrollment, billingAddress, termsAccepted]);

  const isBusy = useMemo(() => {
    return (
      state === ComponentStates.LOADING ||
      (state === ComponentStates.ERROR && error === PaymentErrorMessageId.ERROR_ABORTING)
    );
  }, [state, error]);

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
    WebAnalyticsAPIHandler()?.sendCourseProductEvent(
      CourseProductEvent.PAYMENT_CREATION,
      webAnalyticsEventKey,
    );

    if (!billingAddress) {
      handleError(PaymentErrorMessageId.ERROR_ADDRESS);
    }

    validateTerms();

    if (isReadyToPay) {
      setState(ComponentStates.LOADING);
      setError(undefined);

      if (!payment) {
        const billingAddressPayload = ObjectHelper.omit(billingAddress!, 'id', 'is_main');

        orderMethods.submit(
          {
            id: orderId,
            billing_address: billingAddressPayload,
            ...(creditCard && { credit_card_id: creditCard.id }),
          },
          {
            onSuccess: (orderPayment) => {
              const paymentInfos = {
                ...orderPayment.payment_info,
                order_id: orderId,
              };
              setPayment(paymentInfos);
            },
            onError: async (createPaymentError: HttpError) => {
              if (createPaymentError.responseBody) {
                const responseErrors = await createPaymentError.responseBody;
                if ('max_validated_orders' in responseErrors) {
                  handleError(PaymentErrorMessageId.ERROR_FULL_PRODUCT);
                }
              }
              handleError();
            },
          },
        );
      }
    }
  };

  const createOrder = async () => {
    setState(ComponentStates.LOADING);

    try {
      await runSubmitCallbacks();
    } catch (e) {
      // Example: full name failed saving to OpenEDX.
      setState(ComponentStates.IDLE);
      return;
    }

    if (!billingAddress) {
      handleError(PaymentErrorMessageId.ERROR_ADDRESS);
    }

    validateTerms();

    if (!isReadyToPay) {
      return;
    }

    if (order) {
      createPayment(order.id);
    } else {
      const payload = buildOrderPayload({
        product_id: product.id,
        has_consent_to_terms: termsAccepted,
      });
      orderMethods.create(payload, {
        onSuccess: (newOrder) => {
          createPayment(newOrder.id);
        },
        onError: async () => {
          handleError();
        },
      });
    }
  };

  const handleSuccess = () => {
    let round = 0;

    const checkOrderValidity = async () => {
      if (round >= PAYMENT_SETTINGS.pollLimit) {
        timeoutRef.current = undefined;
        onPaymentSuccessRef.current(false);
      } else {
        const isValidated = await isOrderValidated(payment!.order_id);
        if (isValidated) {
          setState(ComponentStates.IDLE);
          timeoutRef.current = undefined;
          onPaymentSuccessRef.current();
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
    if (error === PaymentErrorMessageId.ERROR_ABORTING) {
      orderMethods
        .abort({
          id: payment!.order_id,
          payment_id: paymentId,
        })
        .then(() => {
          handleError(PaymentErrorMessageId.ERROR_ABORT);
        })
        .catch(() => {
          handleError();
        });
    } else if (state === ComponentStates.ERROR) {
      setPayment(undefined);
    }
  }, [error]);

  useEffect(() => {
    if (state === ComponentStates.ERROR) {
      document.querySelector<HTMLElement>('#sale-tunnel-payment-error')?.focus();
    }
  }, [state]);

  return (
    <>
      {renderTermsCheckbox()}
      <Button
        disabled={isBusy}
        onClick={createOrder}
        data-testid={order && 'payment-button-order-loaded'}
        fullWidth={isMobile}
        {...(state === ComponentStates.ERROR && {
          'aria-describedby': 'sale-tunnel-payment-error',
        })}
      >
        {isBusy ? (
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
      {state === ComponentStates.ERROR && (
        <p className="payment-button__error" id="sale-tunnel-payment-error" tabIndex={-1}>
          <FormattedMessage {...messages[error || PaymentErrorMessageId.ERROR_DEFAULT]} />
        </p>
      )}
    </>
  );
};

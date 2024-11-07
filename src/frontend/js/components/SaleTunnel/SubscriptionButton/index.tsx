import { useEffect, useMemo, useState } from 'react';
import { Alert, Button, VariantType } from '@openfun/cunningham-react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { useSaleTunnelContext } from 'components/SaleTunnel/GenericSaleTunnel';
import { useOrders } from 'hooks/useOrders';
import { OrderCreationPayload } from 'types/Joanie';
import { useMatchMediaLg } from 'hooks/useMatchMedia';
import { SubscriptionErrorMessageId } from 'components/PaymentInterfaces/types';
import { HttpError } from 'utils/errors/HttpError';
import { Spinner } from 'components/Spinner';

const messages = defineMessages({
  subscribe: {
    id: 'components.SaleTunnel.SubscriptionButton.subscribe',
    defaultMessage: 'Subscribe',
    description: 'Label of the button to subscribe to a product.',
  },
  walkthroughToSignAndSavePayment: {
    id: 'components.SaleTunnel.SubscriptionButton.walkthroughToSignAndSavePayment',
    defaultMessage:
      'To enroll in the training, you will first be invited to sign the training agreement and then to define a payment method.',
    description:
      'Message explaining the subscription process with a training agreement to sign and a payment method to set.',
  },
  walkthroughToSign: {
    id: 'components.SaleTunnel.SubscriptionButton.walkthroughToSign',
    defaultMessage:
      'To enroll in the training, you will be invited to sign the training agreement.',
    description:
      'Message explaining the subscription process with only a training agreement to sign.',
  },
  walkthroughToSavePayment: {
    id: 'components.SaleTunnel.SubscriptionButton.walkthroughToSavePayment',
    defaultMessage: 'To enroll in the training, you will be invited to define a payment method.',
    description: 'Message explaining the subscription process with only a payment method to set.',
  },
  errorDefault: {
    defaultMessage: 'An error occurred during order creation. Please retry later.',
    description: 'Error message shown when order creation request failed.',
    id: 'components.SubscriptionButton.errorDefault',
  },
  errorFullProduct: {
    defaultMessage: 'There are no more places available for this product.',
    description:
      'Error message shown when order creation request failed because there is no remaining available seat for the product.',
    id: 'components.SubscriptionButton.errorFullProduct',
  },
  errorAddress: {
    defaultMessage: 'You must have a billing address.',
    description: "Error message shown when the user didn't select a billing address.",
    id: 'components.SubscriptionButton.errorAddress',
  },
  errorWithdrawalRight: {
    defaultMessage: 'You must waive your withdrawal right.',
    description: "Error message shown when the user must waive its withdrawal right but doesn't.",
    id: 'components.SubscriptionButton.errorWithdrawalRight',
  },
  orderCreationInProgress: {
    defaultMessage: 'Order creation in progress',
    description: 'Label for screen reader when an order creation is in progress.',
    id: 'components.SubscriptionButton.orderCreationInProgress',
  },
});

enum ComponentStates {
  IDLE = 'idle',
  LOADING = 'loading',
  ERROR = 'error',
}

interface Props {
  buildOrderPayload: (
    payload: Pick<
      OrderCreationPayload,
      'product_id' | 'billing_address' | 'order_group_id' | 'has_waived_withdrawal_right'
    >,
  ) => OrderCreationPayload;
}

const SubscriptionButton = ({ buildOrderPayload }: Props) => {
  const {
    order,
    creditCard,
    billingAddress,
    hasWaivedWithdrawalRight,
    product,
    nextStep,
    runSubmitCallbacks,
    props: saleTunnelProps,
  } = useSaleTunnelContext();
  const { methods: orderMethods } = useOrders(undefined, { enabled: false });
  const [state, setState] = useState<ComponentStates>(ComponentStates.IDLE);
  const [error, setError] = useState<SubscriptionErrorMessageId | string>();
  const isMobile = useMatchMediaLg();

  const handleError = (
    messageId: SubscriptionErrorMessageId | string = SubscriptionErrorMessageId.ERROR_DEFAULT,
  ) => {
    setState(ComponentStates.ERROR);
    setError(messageId);
  };

  const createOrder = async () => {
    setState(ComponentStates.LOADING);

    try {
      await runSubmitCallbacks();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_error) {
      setState(ComponentStates.IDLE);
      return;
    }

    if (!billingAddress) {
      handleError(SubscriptionErrorMessageId.ERROR_ADDRESS);
      return;
    }

    if (!saleTunnelProps.isWithdrawable && !hasWaivedWithdrawalRight) {
      handleError(SubscriptionErrorMessageId.ERROR_WITHDRAWAL_RIGHT);
      return;
    }

    const payload = buildOrderPayload({
      product_id: product.id,
      billing_address: billingAddress!,
      order_group_id: saleTunnelProps.orderGroup?.id,
      has_waived_withdrawal_right: hasWaivedWithdrawalRight,
    });

    orderMethods.create(payload, {
      onError: async (createOrderError: HttpError) => {
        if (createOrderError.responseBody) {
          const responseErrors = await createOrderError.responseBody;
          if ('max_validated_orders' in responseErrors) {
            handleError(SubscriptionErrorMessageId.ERROR_FULL_PRODUCT);
          }
        }
        handleError();
      },
    });
  };

  const walkthroughMessages = useMemo(() => {
    if (product.contract_definition && product.price > 0) {
      return messages.walkthroughToSignAndSavePayment;
    } else if (product.contract_definition && product.price === 0) {
      return messages.walkthroughToSign;
    } else if (!product.contract_definition && product.price > 0) {
      return messages.walkthroughToSavePayment;
    }
  }, [product, creditCard]);

  useEffect(() => {
    if (order) nextStep();
  }, [order]);

  useEffect(() => {
    if (error && [ComponentStates.IDLE, ComponentStates.LOADING].includes(state)) {
      setError(undefined);
    }
    if (state === ComponentStates.ERROR) {
      document.querySelector<HTMLElement>('#sale-tunnel-subscription-error')?.focus();
    }
  }, [state]);

  return (
    <>
      <div style={{ maxWidth: '680px' }} className="mb-s" data-testid="walkthrough-banner">
        {walkthroughMessages && (
          <Alert type={VariantType.INFO}>
            <FormattedMessage
              {...walkthroughMessages}
              values={{ credictCarNumbers: creditCard?.last_numbers }}
            />
          </Alert>
        )}
      </div>
      <Button
        onClick={createOrder}
        fullWidth={isMobile}
        disabled={state === ComponentStates.LOADING}
        {...(state === ComponentStates.ERROR && {
          'aria-describedby': 'sale-tunnel-payment-error',
        })}
      >
        {state === ComponentStates.LOADING ? (
          <Spinner theme="light" aria-labelledby="order-creation-in-progress">
            <span id="order-creation-in-progress">
              <FormattedMessage {...messages.orderCreationInProgress} />
            </span>
          </Spinner>
        ) : (
          <FormattedMessage {...messages.subscribe} />
        )}
      </Button>
      {state === ComponentStates.ERROR && (
        <p className="subscription-button__error" id="sale-tunnel-subscription-error" tabIndex={-1}>
          {!error || messages.hasOwnProperty(error) ? (
            <FormattedMessage
              {...messages[
                (error as Exclude<
                  SubscriptionErrorMessageId,
                  SubscriptionErrorMessageId.ERROR_ABORT
                >) || SubscriptionErrorMessageId.ERROR_DEFAULT
              ]}
            />
          ) : (
            error
          )}
        </p>
      )}
    </>
  );
};

export default SubscriptionButton;

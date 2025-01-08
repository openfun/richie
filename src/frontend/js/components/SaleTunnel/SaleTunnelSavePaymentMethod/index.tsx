import { defineMessages, FormattedMessage } from 'react-intl';
import { Button } from '@openfun/cunningham-react';
import { useEffect, useState, useRef } from 'react';
import { useSaleTunnelContext } from 'components/SaleTunnel/GenericSaleTunnel';
import { CreditCard, OrderState } from 'types/Joanie';
import { Icon, IconTypeEnum } from 'components/Icon';
import { Payment, PaymentErrorMessageId } from 'components/PaymentInterfaces/types';
import { useCreditCards } from 'hooks/useCreditCards';
import { Spinner } from 'components/Spinner';
import PaymentInterfaces from 'components/PaymentInterfaces';
import { useOrders } from 'hooks/useOrders';
import { CreditCardSelector } from 'components/CreditCardSelector';
import { PAYMENT_SETTINGS } from 'settings';

const messages = defineMessages({
  title: {
    id: 'components.SaleTunnelSavePaymentMethod.title',
    defaultMessage: 'Define a payment method',
    description: 'Content title',
  },
  description: {
    defaultMessage:
      'This is the last step to validate your subscription, you must define a payment method. This one will be used to debit installments. You will not be charged during this step. Pick an existing payment method or add a new one.',
    description: "Text to explain what the user has to do in the 'save payment method' step",
    id: 'components.SaleTunnelSavePaymentMethod.description',
  },
  cta: {
    defaultMessage: 'Define',
    description: 'Label to the call to action to close sale tunnel',
    id: 'components.SaleTunnelSavePaymentMethod.cta',
  },
  errorAbort: {
    defaultMessage: 'You have aborted the payment.',
    description: 'Error message shown when user aborts the payment.',
    id: 'components.PaymentButton.errorAbort',
  },
  errorDefault: {
    defaultMessage: 'An error occurred during payment. Please retry later.',
    description: 'Error message shown when payment creation request failed.',
    id: 'components.PaymentButton.errorDefault',
  },
  tokenizingPayment: {
    defaultMessage: 'Payment method definition in progress.',
    description: 'Label for screen reader when a credit card is being tokenized.',
    id: 'components.PaymentButton.tokenizingPayment',
  },
});

const SaleTunnelSavePaymentMethod = () => {
  const initialCreditCards = useRef<CreditCard[]>([]);
  const [shouldPoll, setShouldPoll] = useState(false);
  const [payment, setPayment] = useState<Payment>();
  const [error, setError] = useState<string>();
  const creditCardsQuery = useCreditCards(undefined, {
    refetchInterval: shouldPoll && PAYMENT_SETTINGS.pollInterval,
  });
  const orders = useOrders(undefined, { enabled: false });
  const { order, nextStep, creditCard, setCreditCard } = useSaleTunnelContext();

  const setPaymentMethod = async (creditCardId: string) => {
    orders.methods.set_payment_method(
      { id: order!.id, credit_card_id: creditCardId },
      { onError: () => handleError() },
    );
  };

  const tokenizePaymentMethod = async () => {
    const data = await creditCardsQuery.methods.tokenize();
    setPayment(data);
    setError(undefined);
  };

  const waitForNewCreditCard = () => {
    const initialIds = initialCreditCards.current.map((cc) => cc.id);
    const newCard = creditCardsQuery.items.find((cc) => !initialIds.includes(cc.id));

    if (!newCard) return;

    setCreditCard(newCard);
    setShouldPoll(false);
    setPaymentMethod(newCard.id);
  };

  const handleError = (message: string = PaymentErrorMessageId.ERROR_DEFAULT) => {
    setError(message);
    setPayment(undefined);
  };

  useEffect(() => {
    if (!payment) {
      initialCreditCards.current = creditCardsQuery.items;
    } else {
      waitForNewCreditCard();
    }
  }, [creditCardsQuery.items]);

  useEffect(() => {
    if (order?.state !== OrderState.TO_SAVE_PAYMENT_METHOD) {
      nextStep();
    }
  }, [order]);

  return (
    <section
      className="sale-tunnel-step sale-tunnel-step--save-payment-method"
      data-testid="generic-sale-tunnel-save-payment-method-step"
    >
      <header className="sale-tunnel-step__header">
        <Icon name={IconTypeEnum.CREDIT_CARD} />
        <h3 className="sale-tunnel-step__title">
          <FormattedMessage {...messages.title} />
        </h3>
      </header>
      <div className="sale-tunnel-step__content">
        <p className="mb-s">
          <FormattedMessage {...messages.description} />
        </p>
        <CreditCardSelector creditCard={creditCard} setCreditCard={setCreditCard} />
      </div>
      <footer className="sale-tunnel-step__footer">
        <Button
          size="medium"
          disabled={!!payment || orders.states.settingPaymentMethod}
          onClick={creditCard ? () => setPaymentMethod(creditCard.id) : tokenizePaymentMethod}
        >
          {payment || orders.states.settingPaymentMethod ? (
            <Spinner size="small">
              <span id="tokenizing-payment">
                <FormattedMessage {...messages.tokenizingPayment} />
              </span>
            </Spinner>
          ) : (
            <FormattedMessage {...messages.cta} />
          )}
        </Button>
        {error && (
          <p className="payment-button__error">
            {messages.hasOwnProperty(error) ? (
              <FormattedMessage {...messages[error as PaymentErrorMessageId]} />
            ) : (
              error
            )}
          </p>
        )}
        {payment && (
          <PaymentInterfaces
            {...payment}
            onSuccess={() => setShouldPoll(true)}
            onError={handleError}
          />
        )}
      </footer>
    </section>
  );
};

export default SaleTunnelSavePaymentMethod;

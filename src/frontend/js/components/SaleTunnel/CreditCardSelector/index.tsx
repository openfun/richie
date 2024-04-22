import {
  Button,
  Modal,
  ModalProps,
  ModalSize,
  Radio,
  RadioGroup,
  useModal,
} from '@openfun/cunningham-react';
import { useEffect, useMemo, useState } from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { CreditCardBrandLogo } from 'pages/DashboardCreditCardsManagement/CreditCardBrandLogo';
import { CreditCard } from 'types/Joanie';
import { useCreditCardsManagement } from 'hooks/useCreditCardsManagement';
import { Spinner } from 'components/Spinner';
import { useSaleTunnelContext } from 'components/SaleTunnel/GenericSaleTunnel';
import { CreditCardExpirationStatus, CreditCardHelper } from 'utils/CreditCardHelper';
import { useMatchMediaLg } from 'hooks/useMatchMedia';

const messages = defineMessages({
  endsWith: {
    id: 'components.SaleTunnel.CreditCardSelector.endsWith',
    description: 'Text to show the credit card code',
    defaultMessage: 'Ends with •••• {code}',
  },
  expiration: {
    id: 'components.SaleTunnel.CreditCardSelector.expiration',
    description: 'Text to show the credit card expiration date',
    defaultMessage: 'Expires on {month}/{year}',
  },
  expired: {
    id: 'components.SaleTunnel.CreditCardSelector.expired',
    description: 'Text to show the credit card expired date',
    defaultMessage: 'Expired since {month}/{year}',
  },
  title: {
    id: 'components.SaleTunnel.CreditCardSelector.title',
    description: 'Title for the credit card section',
    defaultMessage: 'Payment method',
  },
  description: {
    id: 'components.SaleTunnel.CreditCardSelector.description',
    description: 'Description for the credit card section',
    defaultMessage: 'Choose your payment method or add a new one during the payment.',
  },
  creditCardEmptyInlineDescription: {
    id: 'components.SaleTunnel.CreditCardSelector.creditCardEmptyInlineDescription',
    description: 'Description for the empty credit card inline',
    defaultMessage: 'Use another credit card during payment',
  },
  modalTitle: {
    id: 'components.SaleTunnel.CreditCardSelector.modalTitle',
    description: 'Title for the credit card modal',
    defaultMessage: 'Choose credit card',
  },
  modalValidate: {
    id: 'components.SaleTunnel.CreditCardSelector.modalValidate',
    description: 'Validate button for the credit card modal',
    defaultMessage: 'Validate',
  },
  modalDescription: {
    id: 'components.SaleTunnel.CreditCardSelector.modalDescription',
    description: 'Description for the credit card modal',
    defaultMessage:
      'Choose the default payment method you want to use for this order and the upcoming payments.',
  },
  editCreditCardAriaLabel: {
    id: 'components.SaleTunnel.CreditCardSelector.editCreditCardAriaLabel',
    description: 'Aria label for the edit credit card button',
    defaultMessage: 'Change credit card',
  },
});

export const CreditCardSelector = () => {
  const intl = useIntl();
  const modal = useModal();
  const isMobile = useMatchMediaLg();

  const {
    states: { fetching },
    items: creditCards,
  } = useCreditCardsManagement();

  const { creditCard, setCreditCard } = useSaleTunnelContext();

  const getDefaultCreditCard = () => {
    if (creditCards.length === 0) {
      return;
    }
    const mainCreditCard = creditCards.find((card) => card.is_main);
    if (mainCreditCard) {
      return mainCreditCard;
    }
    return creditCards[0];
  };

  useEffect(() => {
    if (!creditCard) {
      setCreditCard(getDefaultCreditCard());
    }
  }, [creditCards]);

  return (
    <div className="credit-card-selector">
      <h4 className="block-title mb-t">
        <FormattedMessage {...messages.title} />
      </h4>
      <div className="description mb-s">
        <FormattedMessage {...messages.description} />
      </div>
      {fetching ? (
        <Spinner />
      ) : (
        <>
          <div className="credit-card-selector__content">
            {creditCard ? <CreditCardInline creditCard={creditCard} /> : <CreditCardEmptyInline />}

            {creditCards?.length > 0 && (
              <Button
                icon={<span className="material-icons">edit</span>}
                color="tertiary-text"
                size="medium"
                onClick={modal.open}
                aria-label={intl.formatMessage(messages.editCreditCardAriaLabel)}
              />
            )}
          </div>
          {creditCard && (
            <Button
              onClick={() => setCreditCard(undefined)}
              size="small"
              color="tertiary"
              className="mt-t"
              fullWidth={isMobile}
            >
              <FormattedMessage {...messages.creditCardEmptyInlineDescription} />
            </Button>
          )}
          {/* This way we make sure the internal state of the modal is reset each time */}
          {modal.isOpen && (
            <CreditCardSelectorModal
              {...modal}
              defaultCreditCard={creditCard!}
              onChange={(newCreditCard) => {
                setCreditCard(newCreditCard);
                modal.close();
              }}
            />
          )}
        </>
      )}
    </div>
  );
};

const CreditCardInline = ({ creditCard }: { creditCard: CreditCard }) => {
  const expirationState = useMemo(
    () => CreditCardHelper.getExpirationState(creditCard),
    [creditCard],
  );
  const expirationMessage =
    expirationState === CreditCardExpirationStatus.EXPIRED ? messages.expired : messages.expiration;
  return (
    <div className="credit-card-selector__card" data-testid={`credit-card-${creditCard.id}`}>
      <CreditCardBrandLogo creditCard={creditCard} variant="inline" />
      <div className="credit-card-selector__card__info">
        <div className="credit-card-selector__card__info__title">{creditCard.title}</div>
        <div className="credit-card-selector__card__info__meta">
          <div>
            <FormattedMessage {...messages.endsWith} values={{ code: creditCard.last_numbers }} />
          </div>
          <div>|</div>
          <div>
            {' '}
            <FormattedMessage
              {...expirationMessage}
              values={{
                month: creditCard.expiration_month.toLocaleString(undefined, {
                  minimumIntegerDigits: 2,
                }),
                year: creditCard.expiration_year,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const CreditCardEmptyInline = () => {
  return (
    <div className="credit-card-selector__card">
      <div className="credit-card-brand-logo--inline credit-card-selector__card__add-logo">
        <span className="material-icons">add_card</span>
      </div>
      <div className="credit-card-selector__card__info">
        <div className="credit-card-selector__card__info__meta">
          <div>
            <FormattedMessage {...messages.creditCardEmptyInlineDescription} />
          </div>
        </div>
      </div>
    </div>
  );
};

export interface CreditCardSelectorModalProps extends Pick<ModalProps, 'isOpen' | 'onClose'> {
  defaultCreditCard?: CreditCard;
  onChange: (creditCard?: CreditCard) => void;
}

const CreditCardSelectorModal = ({
  defaultCreditCard,
  onChange,
  ...props
}: CreditCardSelectorModalProps) => {
  const intl = useIntl();
  const { items: creditCards } = useCreditCardsManagement();
  const [selected, setSelected] = useState(defaultCreditCard);
  return (
    <Modal
      {...props}
      size={ModalSize.MEDIUM}
      title={intl.formatMessage(messages.modalTitle)}
      actions={
        <Button color="primary" size="small" fullWidth={true} onClick={() => onChange(selected)}>
          <FormattedMessage {...messages.modalTitle} />
        </Button>
      }
    >
      <div className="credit-card-selector__modal" data-testid="credit-card-selector-modal">
        <div className="description mb-s">
          <FormattedMessage {...messages.modalDescription} />
        </div>
        <RadioGroup fullWidth={true}>
          {creditCards.map((creditCard) => (
            <Radio
              key={creditCard.id}
              label={<CreditCardInline creditCard={creditCard} />}
              name="credit_card"
              value={creditCard.id}
              fullWidth={true}
              onChange={() => setSelected(creditCard)}
              checked={selected?.id === creditCard.id}
            />
          ))}
          <Radio
            label={<CreditCardEmptyInline />}
            name="credit_card"
            value={undefined}
            fullWidth={true}
            onChange={() => setSelected(undefined)}
            checked={!selected}
          />
        </RadioGroup>
      </div>
    </Modal>
  );
};

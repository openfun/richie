import {
  Button,
  Modal,
  ModalProps,
  ModalSize,
  Radio,
  RadioGroup,
  useModal,
} from '@openfun/cunningham-react';
import { useEffect, useState } from 'react';
import { CreditCardBrandLogo } from 'pages/DashboardCreditCardsManagement/CreditCardBrandLogo';
import { CreditCardFactory } from 'utils/test/factories/joanie';
import { CreditCard, CreditCardBrand } from 'types/Joanie';
import { useCreditCardsManagement } from 'hooks/useCreditCardsManagement';
import { Spinner } from 'components/Spinner';
import { Maybe } from 'types/utils';

export const CreditCardSelector = () => {
  const modal = useModal({ isOpenDefault: false });

  const {
    states: { fetching },
    items: creditCards,
  } = useCreditCardsManagement();

  const [creditCard, setCreditCard] = useState<Maybe<CreditCard>>();

  const getDefaultCreditCard = () => {
    if (creditCards.length === 0) {
      return;
    }
    const mainCreditCard = creditCards.find((_creditCard) => _creditCard.is_main);
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
      <h4 className="block-title mb-t">Payment method</h4>
      <div className="description mb-s">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. In sollicitudin elementum.
      </div>
      {fetching ? (
        <Spinner />
      ) : (
        <>
          <div className="credit-card-selector__content">
            {creditCard ? <CreditCardInline creditCard={creditCard} /> : <CreditCardEmptyInline />}

            <Button
              icon={<span className="material-icons">edit</span>}
              color="tertiary-text"
              size="medium"
              onClick={modal.open}
            />
          </div>
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
  return (
    <div className="credit-card-selector__card">
      <CreditCardBrandLogo
        creditCard={{ ...CreditCardFactory().one(), brand: CreditCardBrand.MASTERCARD }}
        variant="inline"
      />
      <div className="credit-card-selector__card__info">
        <div className="credit-card-selector__card__info__title">{creditCard.title}</div>
        <div className="credit-card-selector__card__info__meta">
          <div>Ends with •••• 9821</div>
          <div>|</div>
          <div>Expires on 02/2032</div>
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
          <div>Add new credit card during payment</div>
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
  const { items: creditCards } = useCreditCardsManagement();
  const [selected, setSelected] = useState(defaultCreditCard);
  return (
    <Modal
      {...props}
      size={ModalSize.MEDIUM}
      title="Choose credit card"
      actions={
        <Button color="primary" size="small" fullWidth={true} onClick={() => onChange(selected)}>
          Validate
        </Button>
      }
    >
      <div className="credit-card-selector__modal">
        <div className="description mb-s">
          Choose the default payment method you want to use for this order and the upcoming
          payments.
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

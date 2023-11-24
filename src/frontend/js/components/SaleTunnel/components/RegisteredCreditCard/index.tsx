import { Checkbox } from '@openfun/cunningham-react';
import { useMemo } from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import type * as Joanie from 'types/Joanie';

const messages = defineMessages({
  inputAriaLabel: {
    defaultMessage: "{selected, select, true {Unselect} other {Select}} {title}'s card",
    description: 'ARIA Label read by screen reader to inform which card is focused',
    id: 'components.RegisteredCreditCard.inputAriaLabel',
  },
  expirationDate: {
    defaultMessage: 'Expiration date: {expirationDate}',
    description: 'Credit card expiration date label',
    id: 'components.RegisteredCreditCard.expirationDate',
  },
});

export interface Props extends Joanie.CreditCard {
  selected: boolean;
  handleSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const RegisteredCreditCard = ({ selected, handleSelect, ...creditCard }: Props) => {
  const intl = useIntl();

  const expirationDate = useMemo(() => {
    const { expiration_month: month, expiration_year: year } = creditCard;
    return intl.formatDate(new Date(year, month - 1, 1), {
      month: '2-digit',
      year: 'numeric',
    });
  }, [creditCard.expiration_month, creditCard.expiration_year]);

  const inputId = useMemo(() => `registered-credit-card-${creditCard.id}`, [creditCard.id]);

  return (
    <label className="registered-credit-card">
      <div className="form-field">
        <Checkbox
          aria-label={intl.formatMessage(messages.inputAriaLabel, {
            title: creditCard.title,
            selected,
          })}
          aria-describedby={`credit-card-${creditCard.id}-infos`}
          checked={selected}
          className="form-field__checkbox-input"
          onChange={handleSelect}
          type="checkbox"
          id={inputId}
        />
      </div>
      <div id={`credit-card-${creditCard.id}-infos`} className="registered-credit-card__infos">
        <strong className="h6 registered-credit-card__name">
          {creditCard.title || creditCard.brand}
        </strong>
        <p className="registered-credit-card__number">{creditCard.last_numbers}</p>
        <p className="registered-credit-card__validity">
          <FormattedMessage {...messages.expirationDate} values={{ expirationDate }} />
        </p>
      </div>
    </label>
  );
};

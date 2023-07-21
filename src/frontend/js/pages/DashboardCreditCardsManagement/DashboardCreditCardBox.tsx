import { defineMessages, FormattedMessage } from 'react-intl';
import { useMemo } from 'react';
import { Button } from '@openfun/cunningham-react';
import { CreditCard } from 'types/Joanie';
import { DashboardBox } from 'widgets/Dashboard/components/DashboardBox';
import { CreditCardExpirationStatus, CreditCardHelper } from 'utils/CreditCardHelper';
import { Icon, IconTypeEnum } from 'components/Icon';
import { CreditCardBrandLogo } from './CreditCardBrandLogo';

const messages = defineMessages({
  isMain: {
    id: 'components.DashboardCreditCardBox.isMain',
    description: 'Text to inform that the credit card is the default one on the dashboard',
    defaultMessage: 'Default credit card',
  },
  endsWith: {
    id: 'components.DashboardCreditCardBox.endsWith',
    description: 'Text to show the credit card code',
    defaultMessage: 'Ends with •••• {code}',
  },
  expiration: {
    id: 'components.DashboardCreditCardBox.expiration',
    description: 'Text to show the credit card expiration date',
    defaultMessage: 'Expires on {month}/{year}',
  },
  expired: {
    id: 'components.DashboardCreditCardBox.expired',
    description: 'Text to show the credit card expired date',
    defaultMessage: 'Expired since {month}/{year}',
  },
  delete: {
    id: 'components.DashboardCreditCardBox.delete',
    description: 'Delete credit card button on the dashboard credit cards list',
    defaultMessage: 'Delete',
  },
  edit: {
    id: 'components.DashboardCreditCardBox.edit',
    description: 'Edit credit card button on the dashboard credit cards list',
    defaultMessage: 'Edit',
  },
  setMain: {
    id: 'components.DashboardCreditCardBox.setMain',
    description: 'Set as default button text on the dashboard credit cards list',
    defaultMessage: 'Use by default',
  },
});

interface Props {
  creditCard: CreditCard;
  edit: (creditCard: CreditCard) => void;
  promote: (creditCard: CreditCard) => void;
  remove: (creditCard: CreditCard) => void;
}

export const DashboardCreditCardBox = ({ creditCard, promote, edit, remove }: Props) => {
  const expirationState = useMemo(
    () => CreditCardHelper.getExpirationState(creditCard),
    [creditCard],
  );
  const expirationMessage =
    expirationState === CreditCardExpirationStatus.EXPIRED ? messages.expired : messages.expiration;

  return (
    <DashboardBox
      data-testid={'dashboard-credit-card__' + creditCard.id}
      header={creditCard.is_main ? <FormattedMessage {...messages.isMain} /> : null}
      footer={
        <>
          <div className="dashboard-credit-card__buttons">
            {!creditCard.is_main && (
              <Button color="primary" onClick={() => promote(creditCard)}>
                <FormattedMessage {...messages.setMain} />
              </Button>
            )}
            <Button color="primary" onClick={() => edit(creditCard)}>
              <FormattedMessage {...messages.edit} />
            </Button>
          </div>
          {!creditCard.is_main && (
            <Button color="primary" onClick={() => remove(creditCard)}>
              <FormattedMessage {...messages.delete} />
            </Button>
          )}
        </>
      }
    >
      <div className="dashboard-credit-card">
        <h6>{creditCard.title}</h6>
        <div className="dashboard-credit-card__details">
          <CreditCardBrandLogo creditCard={creditCard} />
          <div className="dashboard-credit-card__data">
            <p className="dashboard-credit-card__brand">{creditCard.brand}</p>
            <div className="dashboard-credit-card__meta">
              <p className="dashboard-credit-card__code">
                <FormattedMessage
                  {...messages.endsWith}
                  values={{ code: creditCard.last_numbers }}
                />
              </p>
              <p className="dashboard-credit-card__meta__separator">|</p>
              <p
                className={
                  'dashboard-credit-card__expiration dashboard-credit-card__expiration--' +
                  expirationState
                }
              >
                {expirationState === CreditCardExpirationStatus.EXPIRED && (
                  <Icon name={IconTypeEnum.WARNING} size="small" />
                )}
                <FormattedMessage
                  {...expirationMessage}
                  values={{
                    month: creditCard.expiration_month.toLocaleString(undefined, {
                      minimumIntegerDigits: 2,
                    }),
                    year: creditCard.expiration_year,
                  }}
                />
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardBox>
  );
};

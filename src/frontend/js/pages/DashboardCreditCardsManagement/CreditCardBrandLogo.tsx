import classNames from 'classnames';
import { CreditCard, CreditCardBrand } from 'types/Joanie';

export const CreditCardBrandLogo = ({
  creditCard,
  variant = 'default',
}: {
  creditCard: CreditCard;
  variant?: 'default' | 'inline';
}) => {
  const creditCardBrand = Object.values<string>(CreditCardBrand).includes(creditCard.brand)
    ? creditCard.brand
    : CreditCardBrand.CB;

  return (
    <div className={classNames('credit-card-brand-logo', 'credit-card-brand-logo--' + variant)}>
      <img
        alt=""
        src={
          '/static/richie/images/components/DashboardCreditCardsManagement/logo_' +
          creditCardBrand +
          '.svg'
        }
      />
    </div>
  );
};

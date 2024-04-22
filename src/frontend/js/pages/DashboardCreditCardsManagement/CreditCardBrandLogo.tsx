import classNames from 'classnames';
import { CreditCard } from 'types/Joanie';

export const CreditCardBrandLogo = ({
  creditCard,
  variant = 'default',
}: {
  creditCard: CreditCard;
  variant?: 'default' | 'inline';
}) => {
  return (
    <div className={classNames('credit-card-brand-logo', 'credit-card-brand-logo--' + variant)}>
      <img
        alt=""
        src={
          '/static/richie/images/components/DashboardCreditCardsManagement/logo_' +
          creditCard.brand +
          '.svg'
        }
      />
    </div>
  );
};

import { CreditCard } from 'types/Joanie';

export const CreditCardBrandLogo = ({ creditCard }: { creditCard: CreditCard }) => {
  return (
    <div className="credit-card-brand-logo">
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

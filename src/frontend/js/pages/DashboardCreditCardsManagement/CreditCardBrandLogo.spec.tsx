import { render, screen } from '@testing-library/react';
import { CreditCardFactory } from 'utils/test/factories/joanie';
import { CreditCardBrand } from 'types/Joanie';
import { CreditCardBrandLogo } from './CreditCardBrandLogo';

describe('CreditCardBrandLogo', () => {
  it.each(Object.values(CreditCardBrand))('should display the %s brand logo', (brand) => {
    const creditCard = CreditCardFactory({ brand }).one();

    render(<CreditCardBrandLogo creditCard={creditCard} />);

    expect(screen.getByRole('presentation')).toHaveAttribute(
      'src',
      `/static/richie/images/components/DashboardCreditCardsManagement/logo_${brand}.svg`,
    );
  });

  it('should fallback to CB brand if the credit card brand is unknown', () => {
    const creditCard = CreditCardFactory({
      brand: 'unknown',
    }).one();

    render(<CreditCardBrandLogo creditCard={creditCard} />);
    expect(screen.getByRole('presentation')).toHaveAttribute(
      'src',
      '/static/richie/images/components/DashboardCreditCardsManagement/logo_CB.svg',
    );
  });
});

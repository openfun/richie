import { fireEvent, getByRole, getByText, render } from '@testing-library/react';
import { PropsWithChildren } from 'react';
import { IntlProvider } from 'react-intl';
import { CreditCard } from 'types/Joanie';
import { CreditCardFactory } from 'utils/test/factories/joanie';
import { RegisteredCreditCard } from '.';

describe('RegisteredCreditCard', () => {
  const dateFormatter = Intl.DateTimeFormat('en', {
    month: '2-digit',
    year: 'numeric',
  });

  const Wrapper = ({ children }: PropsWithChildren<{}>) => (
    <IntlProvider locale="en">{children}</IntlProvider>
  );

  it('should render credit card information', () => {
    const creditCard: CreditCard = CreditCardFactory().one();

    const { container } = render(
      <Wrapper>
        <RegisteredCreditCard {...creditCard} selected={false} handleSelect={() => undefined} />
      </Wrapper>,
    );

    // - Its title
    getByText(container, creditCard.title!, { exact: true });

    // - Its last numbers
    getByText(container, creditCard.last_numbers);

    // - Then its expiration date
    getByText(
      container,
      `Expiration date: ${dateFormatter.format(
        new Date(creditCard.expiration_year, creditCard.expiration_month - 1, 1),
      )}`,
    );

    // A checkbox input
    getByRole(container, 'checkbox', {
      name: `Select ${creditCard.title}'s card`,
    });
  });

  it('should display the credit card brand if it has not title', () => {
    const creditCard: CreditCard = CreditCardFactory({ title: undefined }).one();

    const { container } = render(
      <Wrapper>
        <RegisteredCreditCard {...creditCard} selected={false} handleSelect={() => undefined} />
      </Wrapper>,
    );

    getByText(container, creditCard.brand);
  });

  it('should have a controlled checkbox to select/unselect the current credit card', () => {
    const creditCard: CreditCard = CreditCardFactory().one();
    let selected = false;
    const handleSelect = jest.fn();

    const { container, rerender } = render(
      <Wrapper>
        <RegisteredCreditCard {...creditCard} selected={selected} handleSelect={handleSelect} />
      </Wrapper>,
    );

    const $checkbox = getByRole(container, 'checkbox', {
      name: `Select ${creditCard.title}'s card`,
    });

    fireEvent.click($checkbox);

    expect(handleSelect).toHaveBeenNthCalledWith(1, expect.objectContaining({ target: $checkbox }));

    // - If we update selected value, the input checkbox state should be updated accordingly
    selected = true;
    rerender(
      <Wrapper>
        <RegisteredCreditCard {...creditCard} selected={selected} handleSelect={handleSelect} />
      </Wrapper>,
    );

    getByRole(container, 'checkbox', {
      name: `Unselect ${creditCard.title}'s card`,
    });
  });
});

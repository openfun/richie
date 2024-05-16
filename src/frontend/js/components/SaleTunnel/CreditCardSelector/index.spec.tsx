import { screen, within } from '@testing-library/react';
import { useMemo, useState } from 'react';
import fetchMock from 'fetch-mock';
import { faker } from '@faker-js/faker';
import userEvent from '@testing-library/user-event';
import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import { CreditCardSelector } from 'components/SaleTunnel/CreditCardSelector/index';
import { render } from 'utils/test/render';
import { CreditCard } from 'types/Joanie';
import {
  CredentialOrderFactory,
  CreditCardFactory,
  ProductFactory,
} from 'utils/test/factories/joanie';
import { SaleTunnelProps } from 'components/SaleTunnel/index';
import { setupJoanieSession } from 'utils/test/wrappers/JoanieAppWrapper';
import { expectNoSpinner, expectSpinner } from 'utils/test/expectSpinner';
import { SaleTunnelStep, SaleTunnelContext, SaleTunnelContextType } from '../GenericSaleTunnel';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: { backend: 'fonzie', endpoint: 'https://auth.test' },
    joanie_backend: { endpoint: 'https://joanie.endpoint' },
  }).one(),
}));

jest.mock('utils/indirection/window', () => ({
  matchMedia: () => ({
    matches: true,
    addListener: jest.fn(),
    removeListener: jest.fn(),
  }),
}));

describe('CreditCardSelector', () => {
  setupJoanieSession();

  const buildWrapper = () => {
    const contextRef = {
      current: {} as SaleTunnelContextType,
    };

    const Wrapper = () => {
      const [creditCard, setCreditCard] = useState<CreditCard>();
      const context: SaleTunnelContextType = useMemo(
        () => ({
          webAnalyticsEventKey: 'eventKey',
          order: CredentialOrderFactory().one(),
          product: ProductFactory().one(),
          props: {} as SaleTunnelProps,
          setBillingAddress: jest.fn(),
          creditCard,
          setCreditCard,
          onPaymentSuccess: jest.fn(),
          step: SaleTunnelStep.PAYMENT,
          registerSubmitCallback: jest.fn(),
          unregisterSubmitCallback: jest.fn(),
          runSubmitCallbacks: jest.fn(),
        }),
        [creditCard],
      );
      contextRef.current = context;

      return (
        <SaleTunnelContext.Provider value={context}>
          <CreditCardSelector />
        </SaleTunnelContext.Provider>
      );
    };

    return { contextRef, Wrapper };
  };

  // Make sure no edit button exists
  it('renders component when no credit card exists, with no edit button', async () => {
    const { Wrapper } = buildWrapper();
    render(<Wrapper />);

    screen.getByRole('heading', {
      name: 'Payment method',
    });
    screen.getByText('Choose your payment method or add a new one during the payment.');

    // During loading state, the spinner should be displayed and the current selected card should not be displayed.
    expect(screen.queryByText('Add new credit card during payment')).not.toBeInTheDocument();
    await expectSpinner();
    await expectNoSpinner();

    screen.getByText('Use another credit card during payment');

    // As the user has no credit card, the edit button should not be displayed.
    expect(
      screen.queryByRole('button', {
        name: 'Change credit card',
      }),
    ).not.toBeInTheDocument();
  });

  it('uses the main credit card as default', async () => {
    const override = {
      expiration_year: faker.date
        .future({ refDate: new Date().setFullYear(new Date().getFullYear() + 2) })
        .getFullYear(),
    };
    const mainCreditCard = CreditCardFactory({
      is_main: true,
      ...override,
    }).one();

    const creditCards = [CreditCardFactory().one(), CreditCardFactory().one(), mainCreditCard];
    fetchMock.get('https://joanie.endpoint/api/v1.0/credit-cards/', creditCards, {
      overwriteRoutes: true,
    });

    const { contextRef, Wrapper } = buildWrapper();
    render(<Wrapper />);
    await expectNoSpinner();

    await screen.findByTestId('credit-card-' + mainCreditCard.id);
    screen.getByText(mainCreditCard.title!);
    screen.getByText('Ends with •••• ' + mainCreditCard.last_numbers);
    screen.getByText(
      'Expires on ' +
        mainCreditCard.expiration_month.toLocaleString(undefined, {
          minimumIntegerDigits: 2,
        }) +
        '/' +
        mainCreditCard.expiration_year,
    );

    expect(contextRef.current.creditCard!.id).toEqual(mainCreditCard.id);
  });

  it('is possible to change the selected credit card', async () => {
    const override = {
      expiration_year: faker.date
        .future({ refDate: new Date().setFullYear(new Date().getFullYear() + 2) })
        .getFullYear(),
    };

    const mainCreditCard = CreditCardFactory({
      is_main: true,
      ...override,
    }).one();

    const creditCards = [...CreditCardFactory(override).many(2), mainCreditCard];
    fetchMock.get('https://joanie.endpoint/api/v1.0/credit-cards/', creditCards, {
      overwriteRoutes: true,
    });

    const { contextRef, Wrapper } = buildWrapper();
    render(<Wrapper />);
    await expectNoSpinner();

    await screen.findByTestId('credit-card-' + mainCreditCard.id);
    screen.getByText(mainCreditCard.title!);
    screen.getByText('Ends with •••• ' + mainCreditCard.last_numbers);

    expect(contextRef.current.creditCard!.id).toEqual(mainCreditCard.id);

    const editButton = screen.getByRole('button', {
      name: 'Change credit card',
    });
    const user = userEvent.setup();

    await user.click(editButton);

    await screen.findByTestId('credit-card-selector-modal');

    await screen.findAllByText('Choose credit card');
    creditCards.forEach((creditCard) => {
      const container = screen.getAllByTestId('credit-card-' + creditCard.id)[0];
      within(container).getByText(creditCard.title!);
      within(container).getByText('Ends with •••• ' + creditCard.last_numbers);
      within(container).getByText(
        'Expires on ' +
          creditCard.expiration_month.toLocaleString(undefined, {
            minimumIntegerDigits: 2,
          }) +
          '/' +
          creditCard.expiration_year,
      );
    });

    const radio = screen.getByRole('radio', {
      name: new RegExp(creditCards[0].title!),
    });
    await user.click(radio);

    const submitButton = screen.getByRole('button', {
      name: 'Choose credit card',
    });
    await user.click(submitButton);

    expect(screen.queryByTestId('credit-card-selector-modal')).not.toBeInTheDocument();

    expect(contextRef.current.creditCard!.id).toEqual(creditCards[0].id);
    await screen.findByTestId('credit-card-' + creditCards[0].id);
    screen.getByText(creditCards[0].title!);
    screen.getByText('Ends with •••• ' + creditCards[0].last_numbers);
  });

  it('is possible to unselect credit card to define a new one during payment via modal', async () => {
    const override = {
      expiration_year: faker.date
        .future({ refDate: new Date().setFullYear(new Date().getFullYear() + 2) })
        .getFullYear(),
    };

    const mainCreditCard = CreditCardFactory({
      is_main: true,
      ...override,
    }).one();

    const creditCards = [...CreditCardFactory(override).many(2), mainCreditCard];
    fetchMock.get('https://joanie.endpoint/api/v1.0/credit-cards/', creditCards, {
      overwriteRoutes: true,
    });

    const { contextRef, Wrapper } = buildWrapper();
    render(<Wrapper />);
    await expectNoSpinner();

    await screen.findByTestId('credit-card-' + mainCreditCard.id);
    screen.getByText(mainCreditCard.title!);
    screen.getByText('Ends with •••• ' + mainCreditCard.last_numbers);
    expect(contextRef.current.creditCard!.id).toEqual(mainCreditCard.id);

    expect(contextRef.current.creditCard!.id).toEqual(mainCreditCard.id);

    const editButton = screen.getByRole('button', {
      name: 'Change credit card',
    });
    const user = userEvent.setup();
    await user.click(editButton);

    const radio = screen.getByRole('radio', {
      name: /Use another credit card during payment/i,
    });
    await user.click(radio);

    const submitButton = screen.getByRole('button', {
      name: 'Choose credit card',
    });
    await user.click(submitButton);

    expect(screen.queryByTestId('credit-card-selector-modal')).not.toBeInTheDocument();
    screen.getByText('Use another credit card during payment');
    expect(contextRef.current.creditCard).toBeUndefined();
  });

  it('is possible to unselect credit card to define a new one during payment via shortcut', async () => {
    const override = {
      expiration_year: faker.date
        .future({ refDate: new Date().setFullYear(new Date().getFullYear() + 2) })
        .getFullYear(),
    };

    const mainCreditCard = CreditCardFactory({
      is_main: true,
      ...override,
    }).one();

    const creditCards = [...CreditCardFactory(override).many(2), mainCreditCard];
    fetchMock.get('https://joanie.endpoint/api/v1.0/credit-cards/', creditCards, {
      overwriteRoutes: true,
    });

    const { contextRef, Wrapper } = buildWrapper();
    render(<Wrapper />);
    await expectNoSpinner();

    await screen.findByTestId('credit-card-' + mainCreditCard.id);
    screen.getByText(mainCreditCard.title!);
    screen.getByText('Ends with •••• ' + mainCreditCard.last_numbers);
    expect(screen.queryByText('Add new credit card during payment')).not.toBeInTheDocument();
    expect(contextRef.current.creditCard!.id).toEqual(mainCreditCard.id);

    const user = userEvent.setup();
    const button = screen.getByRole('button', { name: /use another credit card during payment/i });
    await user.click(button);

    expect(screen.queryByTestId('credit-card-selector-modal')).not.toBeInTheDocument();
    screen.getByText('Use another credit card during payment');
    expect(contextRef.current.creditCard).toBeUndefined();
  });

  it('renders the correct label for expired date', async () => {
    const now = new Date();
    const date = faker.date.past({
      refDate: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59),
    });
    const mainCreditCard = CreditCardFactory({
      is_main: true,
      expiration_month: date.getMonth() + 1,
      expiration_year: date.getFullYear(),
    }).one();

    const creditCards = [mainCreditCard];
    fetchMock.get('https://joanie.endpoint/api/v1.0/credit-cards/', creditCards, {
      overwriteRoutes: true,
    });

    const { Wrapper } = buildWrapper();
    render(<Wrapper />);
    await expectNoSpinner();

    await screen.findByTestId('credit-card-' + mainCreditCard.id);
    screen.getByText(mainCreditCard.title!);
    screen.getByText('Ends with •••• ' + mainCreditCard.last_numbers);
    screen.getByText(
      'Expired since ' +
        mainCreditCard.expiration_month.toLocaleString(undefined, {
          minimumIntegerDigits: 2,
        }) +
        '/' +
        mainCreditCard.expiration_year,
    );
  });
});

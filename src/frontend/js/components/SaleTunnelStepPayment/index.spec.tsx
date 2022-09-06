import { act, fireEvent, render, screen } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { IntlProvider } from 'react-intl';
import { QueryClientProvider } from 'react-query';
import * as mockFactories from 'utils/test/factories';
import { SessionProvider } from 'data/SessionProvider';
import { REACT_QUERY_SETTINGS, RICHIE_USER_TOKEN } from 'settings';
import { Address, CreditCard } from 'types/Joanie';
import createQueryClient from 'utils/react-query/createQueryClient';
import { SaleTunnelStepPayment } from '.';

jest.mock('components/AddressesManagement', () => ({
  __esModule: true,
  LOCAL_BILLING_ADDRESS_ID: 'local-billing-address',
  default: () => <h1>Addresses Management</h1>,
}));

jest.mock('components/PaymentButton', () => ({
  __esModule: true,
  default: () => <h1>Payment Button</h1>,
}));

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockFactories
    .ContextFactory({
      authentication: { backend: 'fonzie', endpoint: 'https://demo.endpoint' },
      joanie_backend: { endpoint: 'https://joanie.endpoint' },
    })
    .generate(),
}));

describe('SaleTunnelStepPayment', () => {
  const initializeUser = () => {
    const user = mockFactories.FonzieUserFactory.generate();

    sessionStorage.setItem(
      REACT_QUERY_SETTINGS.cacheStorage.key,
      JSON.stringify(
        mockFactories.PersistedClientFactory({
          queries: [mockFactories.QueryStateFactory('user', { data: user })],
        }),
      ),
    );
    sessionStorage.setItem(RICHIE_USER_TOKEN, user.access_token);

    return user;
  };

  const mockNext = jest.fn();

  beforeEach(() => {
    initializeUser();
    fetchMock.get('https://joanie.endpoint/api/addresses/', []);
    fetchMock.get('https://joanie.endpoint/api/credit-cards/', []);
    fetchMock.get('https://joanie.endpoint/api/orders/', []);
  });

  afterEach(() => {
    jest.clearAllMocks();
    fetchMock.restore();
  });

  it('should display product title and its price', async () => {
    const product = mockFactories.ProductFactory.generate();

    await act(async () => {
      render(
        <QueryClientProvider client={createQueryClient({ persistor: true })}>
          <IntlProvider locale="en">
            <SessionProvider>
              <SaleTunnelStepPayment product={product} next={mockNext} />
            </SessionProvider>
          </IntlProvider>
        </QueryClientProvider>,
      );
    });

    const formatter = new Intl.NumberFormat('en', {
      currency: product.price_currency,
      style: 'currency',
    });

    // - It should display product information (title & price)
    screen.getByRole('heading', { level: 5, name: 'You are about to purchase' });
    screen.getByText(product.title, { exact: true });
    screen.getByText(formatter.format(product.price).replaceAll(' ', ' '));
  });

  it('should display authenticated user information', async () => {
    const user = initializeUser();
    const product = mockFactories.ProductFactory.generate();

    await act(async () => {
      render(
        <QueryClientProvider client={createQueryClient({ persistor: true })}>
          <IntlProvider locale="en">
            <SessionProvider>
              <SaleTunnelStepPayment product={product} next={mockNext} />
            </SessionProvider>
          </IntlProvider>
        </QueryClientProvider>,
      );
    });

    // - It should display user information
    screen.getByRole('heading', { level: 5, name: 'Your personal information' });
    screen.getByText(user.username, { exact: true });
  });

  it('should display a button to create an address if user has no address ', async () => {
    const product = mockFactories.ProductFactory.generate();

    await act(async () => {
      render(
        <QueryClientProvider client={createQueryClient({ persistor: true })}>
          <IntlProvider locale="en">
            <SessionProvider>
              <SaleTunnelStepPayment product={product} next={mockNext} />
            </SessionProvider>
          </IntlProvider>
        </QueryClientProvider>,
      );
    });

    screen.getByText("You don't have any billing addresses yet.");
    const $button = screen.getByText('Create an address', { selector: 'button' });

    await act(async () => {
      fireEvent.click($button);
    });

    // - Click on the "create an address" button should mount the AddressesManagement component
    screen.getByRole('heading', { level: 1, name: 'Addresses Management' });
  });

  it('should display registered addresses', async () => {
    const product = mockFactories.ProductFactory.generate();
    const addresses = mockFactories.AddressFactory.generate(3) as Address[];
    const randomIndex = Math.floor(Math.random() * addresses.length);
    addresses[randomIndex].is_main = true;

    fetchMock.get('https://joanie.endpoint/api/addresses/', addresses, { overwriteRoutes: true });

    await act(async () => {
      render(
        <QueryClientProvider client={createQueryClient({ persistor: true })}>
          <IntlProvider locale="en">
            <SessionProvider>
              <SaleTunnelStepPayment product={product} next={mockNext} />
            </SessionProvider>
          </IntlProvider>
        </QueryClientProvider>,
      );
    });

    screen.getByRole('heading', { level: 6, name: 'Billing address' });

    // - A button to add an address should be displayed
    screen.getByText('Add an address', { selector: 'button' });

    // - A select field containing all addresses should be displayed
    const dropdown = screen.getByRole('combobox', { name: 'Select a billing address' });
    addresses.forEach((address) => {
      const $option = screen.getByTestId(`address-${address.id}-option`) as HTMLOptionElement;
      // - By default, the main address should be selected
      expect($option.selected).toBe(address.is_main);
    });

    const mainAddress = addresses.find((address) => address.is_main)!;
    screen.getByText(
      new RegExp(
        `^${mainAddress.first_name}\\s${mainAddress.last_name}${mainAddress.address}${mainAddress.postcode}\\s${mainAddress.city},\\s${mainAddress.country}`,
      ),
      {
        selector: 'address',
      },
    );

    // Select another address should update the combobox
    const notMainAddress = addresses.find((a) => !a.is_main)!;
    await act(async () => {
      fireEvent.change(dropdown, { target: { value: notMainAddress.id } });
    });
    screen.getByText(
      new RegExp(
        `^${notMainAddress.first_name}\\s${notMainAddress.last_name}${notMainAddress.address}${notMainAddress.postcode}\\s${notMainAddress.city},\\s${notMainAddress.country}`,
      ),
      {
        selector: 'address',
      },
    );

    // A button to add an address should be displayed
    const $button = screen.getByText('Add an address', { selector: 'button' });

    await act(async () => {
      fireEvent.click($button);
    });

    // - Click on the "create an address" button should mount the AddressesManagement component
    screen.getByRole('heading', { level: 1, name: 'Addresses Management' });
  });

  it('should not display registered credit cards section if user has no credit cards', async () => {
    const product = mockFactories.ProductFactory.generate();

    await act(async () => {
      render(
        <QueryClientProvider client={createQueryClient({ persistor: true })}>
          <IntlProvider locale="en">
            <SessionProvider>
              <SaleTunnelStepPayment product={product} next={mockNext} />
            </SessionProvider>
          </IntlProvider>
        </QueryClientProvider>,
      );
    });

    const $element = screen.queryByRole('heading', {
      level: 5,
      name: 'Your registered credit card',
    });
    expect($element).toBeNull();
  });

  it('should display registered credit cards', async () => {
    const product = mockFactories.ProductFactory.generate();
    const creditCards = mockFactories.CreditCardFactory.generate(3) as CreditCard[];
    const randomIndex = Math.floor(Math.random() * creditCards.length);
    creditCards[randomIndex].is_main = true;

    fetchMock.get('https://joanie.endpoint/api/credit-cards/', creditCards, {
      overwriteRoutes: true,
    });

    await act(async () => {
      render(
        <QueryClientProvider client={createQueryClient({ persistor: true })}>
          <IntlProvider locale="en">
            <SessionProvider>
              <SaleTunnelStepPayment product={product} next={mockNext} />
            </SessionProvider>
          </IntlProvider>
        </QueryClientProvider>,
      );
    });

    screen.getByRole('heading', { level: 5, name: 'Your registered credit card' });

    // - Registered card should be displayed
    const $creditCardList = document.querySelector(
      '.SaleTunnelStepPayment__block--registered-credit-card-list',
    );

    expect($creditCardList).not.toBeNull();
    expect($creditCardList!.childElementCount).toBe(creditCards.length);

    // - By default the main credit card should be selected
    const mainCreditCard = creditCards.find((card) => card.is_main)!;
    screen.getByRole('checkbox', {
      checked: true,
      name: `Unselect ${mainCreditCard.title}'s card`,
    });

    // - But user should be able to select another credit card
    const notMainCreditCard = creditCards.find((card) => !card.is_main)!;
    const $checkbox = screen.getByRole('checkbox', {
      checked: false,
      name: `Select ${notMainCreditCard.title}'s card`,
    });
    await act(async () => {
      fireEvent.click($checkbox);
    });
    screen.getByRole('checkbox', {
      checked: true,
      name: `Unselect ${notMainCreditCard.title}'s card`,
    });
    screen.getByRole('checkbox', { checked: false, name: `Select ${mainCreditCard.title}'s card` });

    // - Or unselect a credit card
    await act(async () => {
      fireEvent.click($checkbox);
    });
    screen.getByRole('checkbox', {
      checked: false,
      name: `Select ${notMainCreditCard.title}'s card`,
    });
  });

  it('should render <PaymentButton />', async () => {
    const product = mockFactories.ProductFactory.generate();

    await act(async () => {
      render(
        <QueryClientProvider client={createQueryClient({ persistor: true })}>
          <IntlProvider locale="en">
            <SessionProvider>
              <SaleTunnelStepPayment product={product} next={mockNext} />
            </SessionProvider>
          </IntlProvider>
        </QueryClientProvider>,
      );
    });

    screen.getByRole('heading', { level: 1, name: 'Payment Button' });
  });
});

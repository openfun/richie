import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { IntlProvider } from 'react-intl';
import { QueryClientProvider } from '@tanstack/react-query';
import { CunninghamProvider } from '@openfun/cunningham-react';
import { PropsWithChildren, useMemo, useState } from 'react';
import userEvent from '@testing-library/user-event';
import { queryByRole } from '@testing-library/dom';
import {
  RichieContextFactory as mockRichieContextFactory,
  UserFactory,
} from 'utils/test/factories/richie';
import {
  ProductFactory,
  AddressFactory,
  CreditCardFactory,
  CourseLightFactory,
} from 'utils/test/factories/joanie';
import { SessionProvider } from 'contexts/SessionContext';
import { Address, CreditCard, Order, Product } from 'types/Joanie';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import { User } from 'types/User';
import { SaleTunnelContext, SaleTunnelContextType } from 'components/SaleTunnel/context';
import { Maybe } from 'types/utils';
import { SaleTunnelStepPayment } from '.';

jest.mock('components/PaymentButton', () => ({
  __esModule: true,
  default: () => <h1>Payment Button</h1>,
}));

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: { backend: 'fonzie', endpoint: 'https://demo.endpoint' },
    joanie_backend: { endpoint: 'https://joanie.endpoint' },
  }).one(),
}));

describe('SaleTunnelStepPayment', () => {
  const Wrapper = ({
    children,
    user,
    product,
  }: PropsWithChildren<{ user?: User; product: Product }>) => {
    const [order, setOrder] = useState<Maybe<Order>>();
    const context: SaleTunnelContextType = useMemo(
      () => ({
        product,
        order,
        setOrder,
        course: CourseLightFactory({ code: '00000' }).one(),
        key: `00000+${product.id}`,
      }),
      [product, order, setOrder],
    );

    return (
      <QueryClientProvider client={createTestQueryClient({ user: user || true })}>
        <IntlProvider locale="en">
          <SessionProvider>
            <CunninghamProvider>
              <SaleTunnelContext.Provider value={context}>{children}</SaleTunnelContext.Provider>
            </CunninghamProvider>
          </SessionProvider>
        </IntlProvider>
      </QueryClientProvider>
    );
  };
  const mockNext = jest.fn();

  beforeEach(() => {
    fetchMock.get('https://joanie.endpoint/api/v1.0/addresses/', []);
    fetchMock.get('https://joanie.endpoint/api/v1.0/credit-cards/', []);
    fetchMock.get('https://joanie.endpoint/api/v1.0/orders/', []);
  });

  afterEach(() => {
    jest.clearAllMocks();
    fetchMock.restore();
  });

  it('should display product title and its price', async () => {
    const product = ProductFactory().one();

    await act(async () => {
      render(
        <Wrapper product={product}>
          <SaleTunnelStepPayment next={mockNext} />
        </Wrapper>,
      );
    });

    const formatter = new Intl.NumberFormat('en', {
      currency: product.price_currency,
      style: 'currency',
    });

    // - It should display product information (title & price)
    screen.getByRole('heading', { level: 2, name: 'You are about to purchase' });
    screen.getByText(product.title, { exact: true });
    screen.getByText(formatter.format(product.price).replaceAll(/\s/g, ' '));
  });

  it('should display authenticated user information', async () => {
    const product = ProductFactory().one();
    const user: User = UserFactory({ full_name: undefined }).one();
    await act(async () => {
      render(
        <Wrapper user={user} product={product}>
          <SaleTunnelStepPayment next={mockNext} />
        </Wrapper>,
      );
    });

    // - It should display user information
    screen.getByRole('heading', { level: 2, name: 'Your personal information' });
    screen.getByText(user.username, { exact: true });
  });

  it('should display a button to create an address if user has no address ', async () => {
    const product = ProductFactory().one();

    await act(async () => {
      render(
        <Wrapper product={product}>
          <SaleTunnelStepPayment next={mockNext} />
        </Wrapper>,
      );
    });

    screen.getByText("You don't have any billing addresses yet.");
    const $button = screen.getByText('Create an address', { selector: 'button' });

    await act(async () => {
      fireEvent.click($button);
    });

    // - Click on the "create an address" button should mount the AddressesManagement component and focus the back button
    expect(screen.getByRole('button', { name: 'Go back' })).toEqual(document.activeElement);

    // clicking the addresses back button should focus the address info zone
    await act(async () => {
      fireEvent.click(document.activeElement!);
    });
    expect(document.activeElement?.id).toBe('sale-tunnel-address-header');
  });

  it('should display registered addresses', async () => {
    const product = ProductFactory().one();
    const addresses = AddressFactory().many(3) as Address[];
    const randomIndex = Math.floor(Math.random() * addresses.length);
    addresses[randomIndex].is_main = true;

    fetchMock.get('https://joanie.endpoint/api/v1.0/addresses/', addresses, {
      overwriteRoutes: true,
    });

    await act(async () => {
      render(
        <Wrapper product={product}>
          <SaleTunnelStepPayment next={mockNext} />
        </Wrapper>,
      );
    });

    screen.getByRole('heading', { level: 3, name: 'Billing address' });

    // - A button to add an address should be displayed
    await screen.findByText('Add an address', { selector: 'button' });

    // - A select field containing all addresses should be displayed
    const dropdown = screen.getByRole('combobox', { name: 'Select a billing address' });
    const addressListBox = screen.getByRole('listbox');
    const $addressOptionById: Record<string, HTMLOptionElement> = {};
    await act(async () => {
      const user = userEvent.setup();
      await user.click(dropdown);
    });
    addresses.forEach((address) => {
      $addressOptionById[address.id] = within(addressListBox).getByRole('option', {
        name: new RegExp(address.title),
      }) as HTMLOptionElement;
      // - By default, the main address should be selected
      expect($addressOptionById[address.id]).toHaveAttribute(
        'aria-selected',
        address.is_main.toString(),
      );
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
      await userEvent.click($addressOptionById[notMainAddress.id]);
    });
    screen.getByText(
      new RegExp(
        `^${notMainAddress.first_name}\\s${notMainAddress.last_name}${notMainAddress.address}${notMainAddress.postcode}\\s${notMainAddress.city},\\s${notMainAddress.country}`,
      ),
      {
        selector: 'address',
      },
    );

    // The select field should not be clearable
    expect(queryByRole(dropdown, 'button', { name: 'Clear selection' })).toBeNull();

    // A button to add an address should be displayed
    const $button = screen.getByText('Add an address', { selector: 'button' });

    await act(async () => {
      fireEvent.click($button);
    });

    // - Click on the "create an address" button should mount the AddressesManagement component
    expect(screen.getByRole('button', { name: 'Go back' })).toEqual(document.activeElement);
  });

  it('should not display registered credit cards section if user has no credit cards', async () => {
    const product = ProductFactory().one();

    await act(async () => {
      render(
        <Wrapper product={product}>
          <SaleTunnelStepPayment next={mockNext} />
        </Wrapper>,
      );
    });

    const $element = screen.queryByRole('heading', {
      level: 5,
      name: 'Your registered credit card',
    });
    expect($element).toBeNull();
  });

  it('should display registered credit cards', async () => {
    const product = ProductFactory().one();
    const creditCards = CreditCardFactory().many(3) as CreditCard[];
    const randomIndex = Math.floor(Math.random() * creditCards.length);
    creditCards[randomIndex].is_main = true;

    fetchMock.get('https://joanie.endpoint/api/v1.0/credit-cards/', creditCards, {
      overwriteRoutes: true,
    });

    await act(async () => {
      render(
        <Wrapper product={product}>
          <SaleTunnelStepPayment next={mockNext} />
        </Wrapper>,
      );
    });

    await screen.findByRole('heading', { level: 5, name: 'Your registered credit card' });

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
    const product = ProductFactory().one();

    render(
      <Wrapper product={product}>
        <SaleTunnelStepPayment next={mockNext} />
      </Wrapper>,
    );

    await waitFor(() => {
      screen.getByRole('heading', { level: 1, name: 'Payment Button' });
    });
  });
});

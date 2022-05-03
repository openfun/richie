import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { PropsWithChildren } from 'react';
import { IntlProvider } from 'react-intl';
import { hydrate, QueryClient, QueryClientProvider } from 'react-query';
import {
  AddressFactory,
  ContextFactory as mockContextFactory,
  CreditCardFactory,
  OrderWithOneClickPaymentFactory,
  OrderWithPaymentFactory,
  PersistedClientFactory,
  ProductFactory,
  QueryStateFactory,
} from 'utils/test/factories';
import JoanieApiProvider from 'data/JoanieApiProvider';
import { CourseCodeProvider } from 'data/CourseCodeProvider';
import { PAYMENT_SETTINGS } from 'settings';
import type * as Joanie from 'types/Joanie';
import { OrderState } from 'types/Joanie';
import createQueryClient from 'utils/react-query/createQueryClient';
import PaymentButton from '.';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockContextFactory({
    authentication: {
      backend: 'fonzie',
      endpoint: 'https://authentication.test',
    },
    joanie_backend: {
      endpoint: 'https://joanie.test',
    },
  }).generate(),
}));

jest.mock('components/PaymentInterfaces');

describe('PaymentButton', () => {
  const formatPrice = (price: number, currency: string) =>
    new Intl.NumberFormat('en', {
      currency,
      style: 'currency',
    }).format(price);

  const Wrapper = ({
    client = new QueryClient(),
    children,
  }: PropsWithChildren<{ client?: QueryClient }>) => (
    <IntlProvider locale="en">
      <JoanieApiProvider>
        <CourseCodeProvider code="00000">
          <QueryClientProvider client={client}>{children}</QueryClientProvider>
        </CourseCodeProvider>
      </JoanieApiProvider>
    </IntlProvider>
  );

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    fetchMock.restore();
    jest.clearAllTimers();
    jest.resetAllMocks();
  });

  it('should render a payment button', () => {
    const product: Joanie.Product = ProductFactory.generate();

    render(
      <Wrapper>
        <PaymentButton product={product} onSuccess={jest.fn()} />
      </Wrapper>,
    );

    const $button = screen.getByRole('button', {
      name: `Pay ${formatPrice(product.price, product.price_currency)}`,
    }) as HTMLButtonElement;

    // As a billing address is missing, button should be disabled
    expect($button.disabled).toBe(true);
  });

  it('should render a payment button with a specific label when a credit card is provided', () => {
    /*
      If a credit card is provided, it seems that the payment should be a one click,
      so the payment button label should mention this information.
    */
    const product: Joanie.Product = ProductFactory.generate();
    const creditCard: Joanie.CreditCard = CreditCardFactory.generate();

    const { rerender } = render(
      <Wrapper>
        <PaymentButton product={product} creditCard={creditCard.id} onSuccess={jest.fn()} />
      </Wrapper>,
    );

    const $button = screen.getByRole('button', {
      name: `Pay in one click ${formatPrice(product.price, product.price_currency)}`,
    }) as HTMLButtonElement;

    // As a billing address is missing, button should be disabled
    expect($button.disabled).toBe(true);

    const billingAddress: Joanie.Address = AddressFactory.generate();

    rerender(
      <Wrapper>
        <PaymentButton
          billingAddress={billingAddress}
          product={product}
          creditCard={creditCard.id}
          onSuccess={jest.fn()}
        />
      </Wrapper>,
    );

    // As a billing address is given, the button should be active
    expect($button.disabled).toBe(false);
  });

  it('should render an enabled payment button if a billing address is provided', () => {
    const product: Joanie.Product = ProductFactory.generate();
    const billingAddress: Joanie.Address = AddressFactory.generate();

    render(
      <Wrapper>
        <PaymentButton billingAddress={billingAddress} product={product} onSuccess={jest.fn()} />
      </Wrapper>,
    );

    const $button = screen.getByRole('button', {
      name: `Pay ${formatPrice(product.price, product.price_currency)}`,
    }) as HTMLButtonElement;

    // As a billing address is given, the button should be active
    expect($button.disabled).toBe(false);
  });

  it('should create an order then display the payment interface when user clicks on payment button', async () => {
    const product: Joanie.Product = ProductFactory.generate();
    const billingAddress: Joanie.Address = AddressFactory.generate();
    const order: Joanie.OrderWithPaymentInfo = OrderWithPaymentFactory.generate();
    const handleSuccess = jest.fn();

    fetchMock
      .post('https://joanie.test/api/orders/', order)
      .get(`https://joanie.test/api/orders/${order.id}/`, {
        ...order,
        state: OrderState.PENDING,
      });

    const { clientState } = PersistedClientFactory({
      queries: [QueryStateFactory('user', { data: { username: 'John Doe' } })],
    });
    const client = createQueryClient();
    hydrate(client, clientState);

    render(
      <Wrapper client={client}>
        <PaymentButton
          billingAddress={billingAddress}
          product={product}
          onSuccess={handleSuccess}
        />
      </Wrapper>,
    );

    const $button = screen.getByRole('button', {
      name: `Pay ${formatPrice(product.price, product.price_currency)}`,
    }) as HTMLButtonElement;

    // - As all information are provided, payment button should not be disabled.
    expect($button.disabled).toBe(false);

    // - User clicks on pay button
    await act(async () => {
      fireEvent.click($button);
    });

    // - Route to create order should have been called
    expect(fetchMock.calls()).toHaveLength(1);
    expect(fetchMock.lastUrl()).toBe('https://joanie.test/api/orders/');

    // - Spinner should be displayed
    screen.getByText('Payment in progress');

    // - Payment interface should be displayed
    screen.getByText('Payment interface component');

    // - Simulate the payment has succeeded
    await act(async () => {
      fireEvent.click(screen.getByTestId('payment-success'));
    });

    // - Once payment succeeded, order should be refetch
    expect(fetchMock.calls()).toHaveLength(2);
    expect(fetchMock.lastUrl()).toBe(`https://joanie.test/api/orders/${order.id}/`);

    // - Order should be polled until its state is validated
    fetchMock.get(
      `https://joanie.test/api/orders/${order.id}/`,
      {
        ...order,
        state: OrderState.VALIDATED,
      },
      {
        overwriteRoutes: true,
      },
    );

    // - Advance timer to one tick
    await act(async () => {
      jest.runOnlyPendingTimers();
    });

    // - Order should have been refetched
    expect(fetchMock.calls()).toHaveLength(3);
    expect(fetchMock.lastUrl()).toBe(`https://joanie.test/api/orders/${order.id}/`);

    // - As order state is validated, the onSuccess callback should be triggered.
    expect(handleSuccess).toHaveBeenCalledTimes(1);

    // - And poller should be stopped
    await act(async () => {
      jest.runOnlyPendingTimers();
    });
    expect(fetchMock.calls()).toHaveLength(3);
  });

  it('should render only a spinner if payment is a one click when user clicks on payment button', async () => {
    const product: Joanie.Product = ProductFactory.generate();
    const billingAddress: Joanie.Address = AddressFactory.generate();
    const creditCard: Joanie.CreditCard = CreditCardFactory.generate();
    const order: Joanie.OrderWithPaymentInfo = OrderWithOneClickPaymentFactory.generate();
    const handleSuccess = jest.fn();

    fetchMock
      .post('https://joanie.test/api/orders/', order)
      .get(`https://joanie.test/api/orders/${order.id}/`, {
        ...order,
        state: OrderState.PENDING,
      });

    const { clientState } = PersistedClientFactory({
      queries: [QueryStateFactory('user', { data: { username: 'John Doe' } })],
    });
    const client = createQueryClient();
    hydrate(client, clientState);

    render(
      <Wrapper client={client}>
        <PaymentButton
          billingAddress={billingAddress}
          creditCard={creditCard.id}
          product={product}
          onSuccess={handleSuccess}
        />
      </Wrapper>,
    );

    const $button = screen.getByRole('button', {
      name: `Pay in one click ${formatPrice(product.price, product.price_currency)}`,
    }) as HTMLButtonElement;

    // - As all information are provided, payment button should not be disabled.
    expect($button.disabled).toBe(false);

    // - User clicks on pay button
    await act(async () => {
      fireEvent.click($button);
    });

    // - Route to create order should have been called
    // - Furthermore, as payment succeeded immediately, order should have been refetched
    expect(fetchMock.calls()).toHaveLength(2);
    expect(fetchMock.calls()[0][0]).toBe('https://joanie.test/api/orders/');
    expect(JSON.parse(fetchMock.calls()[0][1]!.body as string)).toEqual({
      billing_address: billingAddress,
      credit_card_id: creditCard.id,
      course: '00000',
      product: product.id,
    });
    expect(fetchMock.calls()[1][0]).toBe(`https://joanie.test/api/orders/${order.id}/`);

    // - Spinner should be displayed
    screen.getByText('Payment in progress');

    // - Payment interface should not be displayed
    expect(screen.queryByText('Payment interface component')).toBeNull();

    // - Order should be polled until its state is validated
    fetchMock.get(
      `https://joanie.test/api/orders/${order.id}/`,
      {
        ...order,
        state: OrderState.VALIDATED,
      },
      {
        overwriteRoutes: true,
      },
    );

    // - Advance timer to one tick
    await act(async () => {
      jest.runOnlyPendingTimers();
    });

    // - Order should have been refetched
    expect(fetchMock.calls()).toHaveLength(3);
    expect(fetchMock.lastUrl()).toBe(`https://joanie.test/api/orders/${order.id}/`);

    // - As order state is validated, the onSuccess callback should be triggered.
    expect(handleSuccess).toHaveBeenCalledTimes(1);

    // - And poller should be stopped
    await act(async () => {
      jest.runOnlyPendingTimers();
    });
    expect(fetchMock.calls()).toHaveLength(3);
  });

  it('should abort the order if payment does not succeed after a given delay', async () => {
    const product: Joanie.Product = ProductFactory.generate();
    const billingAddress: Joanie.Address = AddressFactory.generate();
    const creditCard: Joanie.CreditCard = CreditCardFactory.generate();
    const order: Joanie.OrderWithPaymentInfo = OrderWithOneClickPaymentFactory.generate();
    const handleSuccess = jest.fn();

    fetchMock
      .post('https://joanie.test/api/orders/', order)
      .get(`https://joanie.test/api/orders/${order.id}/`, {
        ...order,
        state: OrderState.PENDING,
      })
      .post(`https://joanie.test/api/orders/${order.id}/abort/`, 200);

    const { clientState } = PersistedClientFactory({
      queries: [QueryStateFactory('user', { data: { username: 'John Doe' } })],
    });
    const client = createQueryClient();
    hydrate(client, clientState);

    render(
      <Wrapper client={client}>
        <PaymentButton
          billingAddress={billingAddress}
          creditCard={creditCard.id}
          product={product}
          onSuccess={handleSuccess}
        />
      </Wrapper>,
    );

    const $button = screen.getByRole('button', {
      name: `Pay in one click ${formatPrice(product.price, product.price_currency)}`,
    }) as HTMLButtonElement;

    // - As all information are provided, payment button should not be disabled.
    expect($button.disabled).toBe(false);

    // - User clicks on pay button
    await act(async () => {
      fireEvent.click($button);
    });

    // - Route to create order should have been called
    // - Furthermore, as payment succeeded immediately, order should have been refetched
    expect(fetchMock.calls()).toHaveLength(2);
    expect(fetchMock.calls()[0][0]).toBe('https://joanie.test/api/orders/');
    expect(JSON.parse(fetchMock.calls()[0][1]!.body as string)).toEqual({
      billing_address: billingAddress,
      credit_card_id: creditCard.id,
      course: '00000',
      product: product.id,
    });
    expect(fetchMock.calls()[1][0]).toBe(`https://joanie.test/api/orders/${order.id}/`);

    // - Spinner should be displayed
    screen.getByText('Payment in progress');

    // - Payment interface should not be displayed
    expect(screen.queryByText('Payment interface component')).toBeNull();

    fetchMock.resetHistory();
    // - Wait until order has been polled 29 times.
    await waitFor(
      async () => {
        expect(fetchMock.calls()).toHaveLength(PAYMENT_SETTINGS.pollLimit - 1);
      },
      {
        timeout: PAYMENT_SETTINGS.pollLimit * 1000,
        interval: 5,
      },
    );

    // - This round should be the last after which the order should be aborted
    await act(async () => {
      jest.runOnlyPendingTimers();
    });
    expect(fetchMock.calls()).toHaveLength(PAYMENT_SETTINGS.pollLimit);
    expect(fetchMock.lastUrl()).toBe(`https://joanie.test/api/orders/${order.id}/abort/`);
    expect(JSON.parse(fetchMock.lastOptions()!.body!.toString())).toEqual({
      payment_id: order.payment_info.payment_id,
    });

    // - An error message should be displayed
    screen.getByText('An error occurred during payment. Please retry later.');
  });

  it('should render an error message when payment failed', async () => {
    const product: Joanie.Product = ProductFactory.generate();
    const billingAddress: Joanie.Address = AddressFactory.generate();
    const order: Joanie.OrderWithPaymentInfo = OrderWithPaymentFactory.generate();
    const handleSuccess = jest.fn();

    fetchMock
      .post('https://joanie.test/api/orders/', order)
      .get(`https://joanie.test/api/orders/${order.id}/`, {
        ...order,
        state: OrderState.PENDING,
      });

    const { clientState } = PersistedClientFactory({
      queries: [QueryStateFactory('user', { data: { username: 'John Doe' } })],
    });
    const client = createQueryClient();
    hydrate(client, clientState);

    render(
      <Wrapper client={client}>
        <PaymentButton
          billingAddress={billingAddress}
          product={product}
          onSuccess={handleSuccess}
        />
      </Wrapper>,
    );

    const $button = screen.getByRole('button', {
      name: `Pay ${formatPrice(product.price, product.price_currency)}`,
    }) as HTMLButtonElement;

    // - As all information are provided, payment button should not be disabled.
    expect($button.disabled).toBe(false);

    // - User clicks on pay button
    await act(async () => {
      fireEvent.click($button);
    });

    // - Route to create order should have been called
    expect(fetchMock.calls()).toHaveLength(1);
    expect(fetchMock.lastUrl()).toBe('https://joanie.test/api/orders/');
    expect(JSON.parse(fetchMock.lastOptions()!.body!.toString())).toEqual({
      billing_address: billingAddress,
      course: '00000',
      product: product.id,
    });

    // - Spinner should be displayed and payment button should be disabled
    screen.getByText('Payment in progress');
    expect($button.disabled).toBe(true);

    // - Payment interface should be displayed
    screen.getByText('Payment interface component');

    // - Simulate the payment has failed
    await act(async () => {
      fireEvent.click(screen.getByTestId('payment-failure'));
    });

    // - An error message should be displayed
    screen.getByText('An error occurred during payment. Please retry later.');
    // - Payment interface should have been closed
    expect(screen.queryByText('Payment interface component')).toBeNull();
    // - Payment button should have been restore to its idle state
    expect($button.disabled).toBe(false);
    screen.getByRole('button', {
      name: `Pay ${formatPrice(product.price, product.price_currency)}`,
    });
  });
});

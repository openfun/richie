import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { PropsWithChildren, useMemo, useState } from 'react';
import { IntlProvider } from 'react-intl';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import {
  AddressFactory,
  CreditCardFactory,
  CredentialOrderWithOneClickPaymentFactory,
  CredentialOrderWithPaymentFactory,
  CertificateOrderWithOneClickPaymentFactory,
  CertificateOrderWithPaymentFactory,
  CertificateProductFactory,
  CredentialProductFactory,
  CourseLightFactory,
} from 'utils/test/factories/joanie';
import { PAYMENT_SETTINGS } from 'settings';
import type * as Joanie from 'types/Joanie';
import { OrderState, ProductType, Order, Product } from 'types/Joanie';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import JoanieSessionProvider from 'contexts/SessionContext/JoanieSessionProvider';
import { HttpStatusCode } from 'utils/errors/HttpError';
import { Maybe } from 'types/utils';
import { noop } from 'utils';
import { SaleTunnelContextType, SaleTunnelContext } from 'components/SaleTunnel/context';
import PaymentButton from '.';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: {
      backend: 'fonzie',
      endpoint: 'https://authentication.test',
    },
    joanie_backend: {
      endpoint: 'https://joanie.test',
    },
  }).one(),
}));

jest.mock('./components/PaymentInterfaces');

describe.each([
  {
    productType: ProductType.CREDENTIAL,
    ProductFactory: CredentialProductFactory,
    OrderWithOneClickPaymentFactory: CredentialOrderWithOneClickPaymentFactory,
    OrderWithPaymentFactory: CredentialOrderWithPaymentFactory,
  },
  {
    productType: ProductType.CERTIFICATE,
    ProductFactory: CertificateProductFactory,
    OrderWithOneClickPaymentFactory: CertificateOrderWithOneClickPaymentFactory,
    OrderWithPaymentFactory: CertificateOrderWithPaymentFactory,
  },
])(
  'PaymentButton for $productType product',
  ({ ProductFactory, OrderWithOneClickPaymentFactory, OrderWithPaymentFactory }) => {
    let nbApiCalls: number;
    const formatPrice = (price: number, currency: string) =>
      new Intl.NumberFormat('en', {
        currency,
        style: 'currency',
      }).format(price);

    const Wrapper = ({
      client = createTestQueryClient({ user: true }),
      children,
      product,
    }: PropsWithChildren<{ client?: QueryClient; product: Product }>) => {
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
        <IntlProvider locale="en">
          <QueryClientProvider client={client}>
            <JoanieSessionProvider>
              <SaleTunnelContext.Provider value={context}>{children}</SaleTunnelContext.Provider>
            </JoanieSessionProvider>
          </QueryClientProvider>
        </IntlProvider>
      );
    };

    beforeEach(() => {
      jest.useFakeTimers();
      jest.clearAllTimers();
      jest.resetAllMocks();

      fetchMock.restore();
      sessionStorage.clear();

      // Joanie providers calls
      fetchMock.get('https://joanie.test/api/v1.0/orders/', []);
      fetchMock.get('https://joanie.test/api/v1.0/credit-cards/', []);
      fetchMock.get('https://joanie.test/api/v1.0/addresses/', []);
      nbApiCalls = 3;
    });

    afterEach(() => {
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
      cleanup();
    });

    it('should render a payment button', async () => {
      const product: Joanie.Product = ProductFactory().one();
      fetchMock.get(
        `https://joanie.test/api/v1.0/orders/?course_code=00000&product_id=${product.id}&state=pending&state=validated&state=submitted`,
        [],
      );
      render(
        <Wrapper product={product}>
          <PaymentButton onSuccess={jest.fn()} />
        </Wrapper>,
      );

      const $terms = screen.getByLabelText('By checking this box, you accept the');
      await act(async () => {
        fireEvent.click($terms);
      });

      const $button = screen.getByRole('button', {
        name: `Pay ${formatPrice(product.price, product.price_currency)}`,
      }) as HTMLButtonElement;

      // a billing address is missing, but the button stays enabled
      // this allows the user to get feedback on what's missing to make the payment by clicking on the button
      expect($button.disabled).toBe(false);

      // clicking the button should show an error and focus it so that screen reader users know what's happening
      await act(async () => {
        fireEvent.click($button);
      });
      const $error = screen.getByText('You must have a billing address.');
      expect(document.activeElement).toBe($error);
    });

    it('should render a payment button with a specific label when a credit card is provided', () => {
      /*
      If a credit card is provided, it seems that the payment should be a one click,
      so the payment button label should mention this information.
    */
      const product: Joanie.Product = ProductFactory().one();
      const creditCard: Joanie.CreditCard = CreditCardFactory().one();

      fetchMock.get(
        `https://joanie.test/api/v1.0/orders/?course_code=00000&product_id=${product.id}&state=pending&state=validated&state=submitted`,
        [],
      );
      const { rerender } = render(
        <Wrapper product={product}>
          <PaymentButton creditCard={creditCard.id} onSuccess={jest.fn()} />
        </Wrapper>,
      );

      const $button = screen.getByRole('button', {
        name: `Pay in one click ${formatPrice(product.price, product.price_currency)}`,
      }) as HTMLButtonElement;

      // a billing address is missing, but the button stays enabled
      // this allows the user to get feedback on what's missing to make the payment by clicking on the button
      expect($button.disabled).toBe(false);

      const billingAddress: Joanie.Address = AddressFactory().one();

      rerender(
        <Wrapper product={product}>
          <PaymentButton
            billingAddress={billingAddress}
            creditCard={creditCard.id}
            onSuccess={jest.fn()}
          />
        </Wrapper>,
      );

      // the button should be active
      expect($button.disabled).toBe(false);
    });

    it('should render an enabled payment button if a billing address is provided', () => {
      const product: Joanie.Product = ProductFactory().one();
      const billingAddress: Joanie.Address = AddressFactory().one();

      fetchMock.get(
        `https://joanie.test/api/v1.0/orders/?course_code=00000&product_id=${product.id}&state=pending&state=validated&state=submitted`,
        [],
      );
      render(
        <Wrapper product={product}>
          <PaymentButton billingAddress={billingAddress} onSuccess={jest.fn()} />
        </Wrapper>,
      );

      const $button = screen.getByRole('button', {
        name: `Pay ${formatPrice(product.price, product.price_currency)}`,
      }) as HTMLButtonElement;

      // the button should be active
      expect($button.disabled).toBe(false);
    });

    it('should create an order then display the payment interface when user clicks on payment button', async () => {
      const product: Joanie.Product = ProductFactory().one();
      const billingAddress: Joanie.Address = AddressFactory().one();
      const handleSuccess = jest.fn();
      const { payment_info: paymentInfo, ...order } = OrderWithPaymentFactory().one();
      fetchMock
        .get(
          `https://joanie.test/api/v1.0/orders/?course_code=00000&product_id=${product.id}&state=pending&state=validated&state=submitted`,
          [],
        )
        .post('https://joanie.test/api/v1.0/orders/', order)
        .patch(`https://joanie.test/api/v1.0/orders/${order.id}/submit/`, {
          paymentInfo,
        })
        .get(`https://joanie.test/api/v1.0/orders/${order.id}/`, {
          ...order,
        });

      render(
        <Wrapper client={createTestQueryClient({ user: true })} product={product}>
          <PaymentButton billingAddress={billingAddress} onSuccess={handleSuccess} />
        </Wrapper>,
      );
      nbApiCalls += 1; // fetch order for useProductOrder
      expect(fetchMock.calls()).toHaveLength(nbApiCalls);

      const $terms = screen.getByLabelText('By checking this box, you accept the');
      await act(async () => {
        fireEvent.click($terms);
      });

      const $button = screen.getByRole('button', {
        name: `Pay ${formatPrice(product.price, product.price_currency)}`,
      }) as HTMLButtonElement;

      // - Payment button should not be disabled.
      expect($button.disabled).toBe(false);

      // - User clicks on pay button
      await act(async () => {
        fireEvent.click($button);
      });

      // - Route to create order should have been called
      nbApiCalls += 1; // order post create (invalidate queries)
      nbApiCalls += 1; // refetch omniscient orders
      nbApiCalls += 1; // refetch useProductOrder
      nbApiCalls += 1; // order submit

      await waitFor(() => expect(fetchMock.calls()).toHaveLength(nbApiCalls));
      expect(fetchMock.lastUrl()).toBe(`https://joanie.test/api/v1.0/orders/${order.id}/submit/`);

      // - Spinner should be displayed
      screen.getByText('Payment in progress');

      // - Payment interface should be displayed
      screen.getByText('Payment interface component');

      // - Simulate the payment has succeeded
      await act(async () => {
        fireEvent.click(screen.getByTestId('payment-success'));
      });

      // - Once payment succeeded, order should be refetch
      nbApiCalls += 1; // fetch validated order
      expect(fetchMock.calls()).toHaveLength(nbApiCalls);
      expect(fetchMock.lastUrl()).toBe(`https://joanie.test/api/v1.0/orders/${order.id}/`);

      // - Order should be polled until its state is validated
      fetchMock.get(
        `https://joanie.test/api/v1.0/orders/${order.id}/`,
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
      expect(fetchMock.calls()).toHaveLength(nbApiCalls);
      expect(fetchMock.lastUrl()).toBe(`https://joanie.test/api/v1.0/orders/${order.id}/`);

      // - As order state is validated, the onSuccess callback should be triggered.
      expect(handleSuccess).toHaveBeenCalledTimes(1);

      // - And poller should be stopped
      await act(async () => {
        jest.runOnlyPendingTimers();
      });
      expect(fetchMock.calls()).toHaveLength(nbApiCalls);
    });

    it('should render a payment button and not call the order creation route', async () => {
      const product: Joanie.Product = ProductFactory().one();
      const billingAddress: Joanie.Address = AddressFactory().one();
      const creditCard: Joanie.CreditCard = CreditCardFactory().one();
      const { payment_info: paymentInfo, ...order } = OrderWithOneClickPaymentFactory().one();
      const handleSuccess = jest.fn();
      const initialOrder = {
        ...order,
        state: OrderState.PENDING,
      };
      const orderSubmitted = {
        ...order,
        state: OrderState.SUBMITTED,
      };

      fetchMock
        .get(
          `https://joanie.test/api/v1.0/orders/?course_code=00000&product_id=${product.id}&state=pending&state=validated&state=submitted`,
          [initialOrder],
        )
        .post('https://joanie.test/api/v1.0/orders/', order)
        .patch(`https://joanie.test/api/v1.0/orders/${order.id}/submit/`, {
          payment_info: paymentInfo,
        })
        .get(`https://joanie.test/api/v1.0/orders/${order.id}/`, orderSubmitted);

      render(
        <Wrapper client={createTestQueryClient({ user: true })} product={product}>
          <PaymentButton
            billingAddress={billingAddress}
            creditCard={creditCard.id}
            onSuccess={handleSuccess}
          />
        </Wrapper>,
      );
      await waitFor(() => {
        expect(screen.getByTestId('payment-button-order-loaded')).toBeInTheDocument();
      });

      const $terms = screen.getByLabelText('By checking this box, you accept the');
      await act(async () => {
        fireEvent.click($terms);
      });

      nbApiCalls += 1; // useProductOrder get order with filters
      expect(fetchMock.calls()).toHaveLength(nbApiCalls);
      const $button = screen.getByRole('button', {
        name: `Pay in one click ${formatPrice(product.price, product.price_currency)}`,
      }) as HTMLButtonElement;

      // - Payment button should not be disabled.
      expect($button.disabled).toBe(false);

      // - User clicks on pay button
      fetchMock.get(
        `https://joanie.test/api/v1.0/orders/?course_code=00000&product_id=${product.id}&state=pending&state=validated&state=submitted`,
        [orderSubmitted],
        { overwriteRoutes: true },
      );
      await act(async () => {
        fireEvent.click($button);
      });

      // - In real world condition the success callback is immediately called for one click payments.
      // - but here we need to click manually.
      const $success = screen.getByTestId('payment-success');
      await act(async () => {
        fireEvent.click($success);
      });

      // - Route to submit an existing order
      // - Furthermore, as payment succeeded immediately, order should have been refetched
      nbApiCalls += 1; // order submit
      nbApiCalls += 1; // order get on id
      expect(fetchMock.calls()).toHaveLength(nbApiCalls);

      const submitCall = fetchMock
        .calls()
        .find((call) => call[0] === `https://joanie.test/api/v1.0/orders/${order.id}/submit/`);
      expect(submitCall).not.toBeUndefined();
      expect(JSON.parse(submitCall![1]!.body as string)).toEqual({
        billing_address: billingAddress,
        credit_card_id: creditCard.id,
      });
      expect(fetchMock.lastUrl()).toBe(`https://joanie.test/api/v1.0/orders/${order.id}/`);

      // - Spinner should be displayed
      screen.getByText('Payment in progress');

      // - Order should be polled until its state is validated
      fetchMock.get(
        `https://joanie.test/api/v1.0/orders/${order.id}/`,
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
      nbApiCalls += 1; // order get on id
      expect(fetchMock.calls()).toHaveLength(nbApiCalls);
      expect(fetchMock.lastUrl()).toBe(`https://joanie.test/api/v1.0/orders/${order.id}/`);

      // - As order state is validated, the onSuccess callback should be triggered.
      expect(handleSuccess).toHaveBeenCalledTimes(1);
      // - And poller should be stopped
      await act(async () => {
        jest.runOnlyPendingTimers();
      });
      expect(fetchMock.calls()).toHaveLength(nbApiCalls);
    });

    it('should abort the order if payment does not succeed after a given delay', async () => {
      const product: Joanie.Product = ProductFactory().one();
      const billingAddress: Joanie.Address = AddressFactory().one();
      const creditCard: Joanie.CreditCard = CreditCardFactory().one();
      const { payment_info: paymentInfo, ...order } = OrderWithOneClickPaymentFactory().one();
      const orderSubmitted = {
        ...order,
        state: OrderState.SUBMITTED,
      };
      const handleSuccess = jest.fn();

      fetchMock
        .get(
          `https://joanie.test/api/v1.0/orders/?course_code=00000&product_id=${product.id}&state=pending&state=validated&state=submitted`,
          [orderSubmitted],
        )
        .post('https://joanie.test/api/v1.0/orders/', order)
        .patch(`https://joanie.test/api/v1.0/orders/${order.id}/submit/`, {
          payment_info: paymentInfo,
        })
        .get(`https://joanie.test/api/v1.0/orders/${order.id}/`, orderSubmitted)
        .post(`https://joanie.test/api/v1.0/orders/${order.id}/abort/`, HttpStatusCode.OK);

      render(
        <Wrapper client={createTestQueryClient({ user: true })} product={product}>
          <PaymentButton
            billingAddress={billingAddress}
            creditCard={creditCard.id}
            onSuccess={handleSuccess}
          />
        </Wrapper>,
      );
      await waitFor(() => {
        expect(screen.getByTestId('payment-button-order-loaded')).toBeInTheDocument();
      });
      nbApiCalls += 1; // fetcher order for userProductOrder
      const apiCalls = fetchMock.calls().map((call) => call[0]);
      expect(apiCalls).toContain(
        `https://joanie.test/api/v1.0/orders/?course_code=00000&product_id=${product.id}&state=pending&state=validated&state=submitted`,
      );

      const $terms = screen.getByLabelText('By checking this box, you accept the');
      await act(async () => {
        fireEvent.click($terms);
      });

      const $button = screen.getByRole('button', {
        name: `Pay in one click ${formatPrice(product.price, product.price_currency)}`,
      }) as HTMLButtonElement;

      // - Payment button should not be disabled.
      expect($button.disabled).toBe(false);

      // - User clicks on pay button
      await act(async () => {
        fireEvent.click($button);
      });

      // - In real world condition the success callback is immediately called for one click payments.
      // - but here we need to click manually.
      const $success = screen.getByTestId('payment-success');
      await act(async () => {
        fireEvent.click($success);
      });

      // - Route to create order should have been called
      // - Furthermore, as payment succeeded immediately, order should have been refetched
      const onClickApiCalls = fetchMock.calls().splice(nbApiCalls);
      nbApiCalls += 1; // order submit
      nbApiCalls += 1; // fetch validated order
      expect(fetchMock.calls()).toHaveLength(nbApiCalls);

      expect(onClickApiCalls[0][0]).toBe(`https://joanie.test/api/v1.0/orders/${order.id}/submit/`);
      expect(JSON.parse(onClickApiCalls[0][1]!.body as string)).toEqual({
        billing_address: billingAddress,
        credit_card_id: creditCard.id,
      });

      expect(onClickApiCalls[1][0]).toBe(`https://joanie.test/api/v1.0/orders/${order.id}/`);

      // - Spinner should be displayed
      screen.getByText('Payment in progress');

      fetchMock.resetHistory();
      // - Wait until order has been polled 29 times.
      await jest.advanceTimersToNextTimerAsync(PAYMENT_SETTINGS.pollLimit);
      expect(fetchMock.calls()).toHaveLength(PAYMENT_SETTINGS.pollLimit - 1);

      // - This round should be the last after which the order should be aborted
      await act(async () => {
        jest.runOnlyPendingTimers();
      });

      await waitFor(
        async () => {
          expect(fetchMock.calls()).toHaveLength(PAYMENT_SETTINGS.pollLimit);
          expect(fetchMock.lastUrl()).toBe(
            `https://joanie.test/api/v1.0/orders/${order.id}/abort/`,
          );
        },
        {
          timeout: 1100,
        },
      );

      expect(JSON.parse(fetchMock.lastOptions()!.body!.toString())).toEqual({
        payment_id: paymentInfo.payment_id,
      });

      // - An error message should be displayed and focused (for screen reader users)
      const $error = screen.getByText('An error occurred during payment. Please retry later.');
      expect(document.activeElement).toBe($error);
    }, 10000);

    it('should render an error message when payment failed', async () => {
      const product: Joanie.Product = ProductFactory().one();
      const billingAddress: Joanie.Address = AddressFactory().one();
      const { payment_info: paymentInfo, ...order } = OrderWithPaymentFactory().one();
      const handleSuccess = jest.fn();

      fetchMock
        .get(
          `https://joanie.test/api/v1.0/orders/?course_code=00000&product_id=${product.id}&state=pending&state=validated&state=submitted`,
          [],
        )
        .post('https://joanie.test/api/v1.0/orders/', order)
        .patch(`https://joanie.test/api/v1.0/orders/${order.id}/submit/`, {
          payment_info: paymentInfo,
        })
        .get(`https://joanie.test/api/v1.0/orders/${order.id}/`, {
          ...order,
          state: OrderState.SUBMITTED,
        });

      render(
        <Wrapper client={createTestQueryClient({ user: true })} product={product}>
          <PaymentButton billingAddress={billingAddress} onSuccess={handleSuccess} />
        </Wrapper>,
      );
      nbApiCalls += 1; // useProductOrder get order with filters
      expect(fetchMock.calls()).toHaveLength(nbApiCalls);

      const $terms = screen.getByLabelText('By checking this box, you accept the');
      await act(async () => {
        fireEvent.click($terms);
      });

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
      nbApiCalls += 1; // order post create (invalidate queries)
      nbApiCalls += 1; // refetch omniscient orders
      nbApiCalls += 1; // refetch useProductOrder
      nbApiCalls += 1; // order submit
      expect(fetchMock.calls()).toHaveLength(nbApiCalls);

      expect(fetchMock.lastUrl()).toBe(`https://joanie.test/api/v1.0/orders/${order.id}/submit/`);
      expect(JSON.parse(fetchMock.lastOptions()!.body!.toString())).toEqual({
        billing_address: billingAddress,
      });

      // - Spinner should be displayed and payment button should be disabled
      screen.getByText('Payment in progress');
      expect($button.disabled).toBe(true);

      // - Payment interface should be displayed
      await screen.findByText('Payment interface component');

      // - Simulate the payment has failed
      await act(async () => {
        fireEvent.click(screen.getByTestId('payment-failure'));
      });

      // - An error message should be displayed
      const $error = screen.getByText('An error occurred during payment. Please retry later.');
      expect(document.activeElement).toBe($error);
      // - Payment interface should have been closed
      expect(screen.queryByText('Payment interface component')).toBeNull();
      // - Payment button should have been restore to its idle state
      expect($button.disabled).toBe(false);
      screen.getByRole('button', {
        name: `Pay ${formatPrice(product.price, product.price_currency)}`,
      });
    });

    it('should show an error if product has a contract definition and the terms are not accepted', async () => {
      const product: Joanie.Product = ProductFactory().one();
      const billingAddress: Joanie.Address = AddressFactory().one();

      fetchMock.get(
        `https://joanie.test/api/v1.0/orders/?course=00000&product=${product.id}&state=pending&state=validated&state=submitted`,
        [],
      );

      render(
        <Wrapper client={createTestQueryClient({ user: true })} product={product}>
          <PaymentButton billingAddress={billingAddress} onSuccess={noop} />
        </Wrapper>,
      );

      const $button = screen.getByRole('button', {
        name: `Pay ${formatPrice(product.price, product.price_currency)}`,
      }) as HTMLButtonElement;

      // - As all information are provided, payment button should not be disabled.
      expect($button.disabled).toBe(false);

      expect(screen.queryByText('You must accept the terms')).not.toBeInTheDocument();

      // - User clicks on pay button
      await act(async () => {
        fireEvent.click($button);
      });

      expect(screen.getByText('You must accept the terms.')).toBeInTheDocument();
    });

    it('should be able to preview the contract if product has a contract definition', async () => {
      // eslint-disable-next-line compat/compat
      URL.createObjectURL = jest.fn((blob) => blob) as any;
      window.open = jest.fn();

      const product: Joanie.Product = ProductFactory().one();
      const billingAddress: Joanie.Address = AddressFactory().one();

      const PREVIEW_URL = `https://joanie.test/api/v1.0/contract_definitions/${
        product.contract_definition!.id
      }/preview_template/`;

      fetchMock
        .get(
          `https://joanie.test/api/v1.0/orders/?course=00000&product=${product.id}&state=pending&state=validated&state=submitted`,
          [],
        )
        .get(PREVIEW_URL, 'preview content');

      render(
        <Wrapper client={createTestQueryClient({ user: true })} product={product}>
          <PaymentButton billingAddress={billingAddress} onSuccess={noop} />
        </Wrapper>,
      );

      const $terms = screen.getByRole('button', { name: 'General Terms of Sale' });

      // eslint-disable-next-line compat/compat
      expect(URL.createObjectURL).toHaveBeenCalledTimes(0);
      expect(window.open).toHaveBeenCalledTimes(0);
      expect(fetchMock.called(PREVIEW_URL)).toBe(false);

      // console.log($terms);
      await act(async () => {
        fireEvent.click($terms);
      });

      expect(fetchMock.called(PREVIEW_URL)).toBe(true);
      // eslint-disable-next-line compat/compat
      expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
      // eslint-disable-next-line compat/compat
      expect(URL.createObjectURL).toHaveBeenCalledWith('preview content');
      expect(window.open).toHaveBeenCalledTimes(1);
      expect(window.open).toHaveBeenCalledWith('preview content');
    });

    it('should not show terms checkbox if the product does not have a contract definition', async () => {
      const product: Joanie.Product = ProductFactory().one();
      product.contract_definition = undefined;
      const billingAddress: Joanie.Address = AddressFactory().one();

      const { payment_info: paymentInfo, ...order } = OrderWithPaymentFactory().one();

      fetchMock
        .get(
          `https://joanie.test/api/v1.0/orders/?course=00000&product=${product.id}&state=pending&state=validated&state=submitted`,
          [],
        )
        .post('https://joanie.test/api/v1.0/orders/', order)
        .patch(`https://joanie.test/api/v1.0/orders/${order.id}/submit/`, {
          paymentInfo,
        });

      render(
        <Wrapper client={createTestQueryClient({ user: true })} product={product}>
          <PaymentButton billingAddress={billingAddress} onSuccess={noop} />
        </Wrapper>,
      );

      const $button = screen.getByRole('button', {
        name: `Pay ${formatPrice(product.price, product.price_currency)}`,
      }) as HTMLButtonElement;

      // - As all information are provided, payment button should not be disabled.
      expect($button.disabled).toBe(false);

      // - The terms checbkox is not rendered.
      expect(
        screen.queryByLabelText('By checking this box, you accept the General Terms of Sale'),
      ).not.toBeInTheDocument();

      // - User clicks on pay button
      await act(async () => {
        fireEvent.click($button);
      });

      // - No errors.
      expect(screen.queryByText('You must accept the terms.')).not.toBeInTheDocument();

      // - Payment interface should be displayed.
      screen.getByText('Payment interface component');
    });
  },
);

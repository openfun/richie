import fetchMock from 'fetch-mock';
import { QueryClientProvider } from '@tanstack/react-query';
import { IntlProvider } from 'react-intl';
import { PropsWithChildren } from 'react';
import { act, renderHook } from '@testing-library/react';
import { waitFor } from '@testing-library/dom';
import { faker } from '@faker-js/faker';
import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import { SessionProvider } from 'contexts/SessionContext';
import { AddressFactory, CertificateOrderFactory } from 'utils/test/factories/joanie';
import { Deferred } from 'utils/test/deferred';
import { HttpStatusCode } from 'utils/errors/HttpError';
import { useOmniscientOrder, useOmniscientOrders, useOrder, useOrders } from '.';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: { backend: 'fonzie', endpoint: 'https://demo.endpoint' },
    joanie_backend: { endpoint: 'https://joanie.endpoint' },
  }).one(),
}));

describe('useOrders', () => {
  const Wrapper = ({ children }: PropsWithChildren) => {
    return (
      <QueryClientProvider client={createTestQueryClient({ user: true })}>
        <IntlProvider locale="en">
          <SessionProvider>{children}</SessionProvider>
        </IntlProvider>
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    fetchMock.get('https://joanie.endpoint/api/v1.0/orders/', []);
    fetchMock.get('https://joanie.endpoint/api/v1.0/addresses/', []);
    fetchMock.get('https://joanie.endpoint/api/v1.0/credit-cards/', []);
  });

  afterEach(() => {
    fetchMock.restore();
  });

  describe('omniscient', () => {
    it('retrieves all the orders', async () => {
      const orders = CertificateOrderFactory().many(5);
      const deferrer = new Deferred<typeof orders>();
      fetchMock.get('https://joanie.endpoint/api/v1.0/orders/', deferrer.promise, {
        overwriteRoutes: true,
      });

      const { result } = renderHook(useOmniscientOrders, {
        wrapper: Wrapper,
      });

      await waitFor(() => {
        expect(result.current.states.fetching).toBe(true);
      });
      expect(result.current.states.isPending).toBe(true);
      expect(result.current.states.isFetched).toBe(false);
      expect(result.current.states.creating).toBe(false);
      expect(result.current.items).toEqual([]);

      await act(async () => {
        deferrer.resolve(orders);
      });

      await waitFor(() => {
        expect(result.current.states.fetching).toBe(false);
      });
      expect(result.current.states.isPending).toBe(false);
      expect(result.current.states.isFetched).toBe(true);
      expect(result.current.states.creating).toBe(false);
      expect(result.current.items).toEqual(orders);
    });

    it('retrieves a specific order omnisciently', async () => {
      const orders = CertificateOrderFactory().many(5);
      const deferrer = new Deferred<typeof orders>();
      fetchMock.get('https://joanie.endpoint/api/v1.0/orders/', deferrer.promise, {
        overwriteRoutes: true,
      });

      const { result } = renderHook(() => useOmniscientOrder(orders[2].id), {
        wrapper: Wrapper,
      });

      await waitFor(() => {
        expect(result.current.states.fetching).toBe(true);
      });
      expect(result.current.states.isPending).toBe(true);
      expect(result.current.states.isFetched).toBe(false);
      expect(result.current.states.creating).toBe(false);
      expect(result.current.item).toEqual(undefined);

      await act(async () => {
        deferrer.resolve(orders);
      });

      await waitFor(() => {
        expect(result.current.states.fetching).toBe(false);
      });
      expect(result.current.states.isPending).toBe(false);
      expect(result.current.states.isFetched).toBe(true);
      expect(result.current.states.creating).toBe(false);
      expect(result.current.item).toEqual(orders[2]);
    });

    it('submits an order', async () => {
      const deferrer = new Deferred();
      const id = faker.string.uuid();
      const billingAddress = AddressFactory().one();
      const creditCardId = faker.string.uuid();
      fetchMock.patch(`https://joanie.endpoint/api/v1.0/orders/${id}/submit/`, deferrer.promise);

      const { result } = renderHook(() => useOmniscientOrders(undefined, { enabled: false }), {
        wrapper: Wrapper,
      });

      await waitFor(() => {
        expect(result.current).not.toBeNull();
      });

      await act(async () => {
        result.current.methods.submit({
          id,
          billing_address: billingAddress,
          credit_card_id: creditCardId,
        });
      });

      await waitFor(() => {
        expect(result.current.states.isPending).toBe(true);
      });
      expect(result.current.states.fetching).toBe(false);
      expect(result.current.states.submitting).toBe(true);

      await act(async () => {
        deferrer.resolve(HttpStatusCode.OK);
      });

      await waitFor(() => {
        expect(result.current.states.isPending).toBe(false);
      });
      expect(result.current.states.submitting).toBe(false);
    });

    it('manages submit mutation failure', async () => {
      const id = faker.string.uuid();
      const billingAddress = AddressFactory().one();
      const creditCardId = faker.string.uuid();
      fetchMock.patch(
        `https://joanie.endpoint/api/v1.0/orders/${id}/submit/`,
        HttpStatusCode.INTERNAL_SERVER_ERROR,
      );

      const { result } = renderHook(() => useOmniscientOrders(undefined, { enabled: false }), {
        wrapper: Wrapper,
      });

      await waitFor(() => {
        expect(result.current).not.toBeNull();
      });

      expect(result.current.states.error).toBe(undefined);

      await act(async () => {
        await expect(
          result.current.methods.submit({
            id,
            billing_address: billingAddress,
            credit_card_id: creditCardId,
          }),
        ).rejects.toThrow('Internal Server Error');
      });

      expect(result.current.states.error).toBe('Cannot submit the order.');
      expect(result.current.states.isPending).toBe(false);
      expect(result.current.states.submitting).toBe(false);
    });

    it('aborts an order', async () => {
      const deferrer = new Deferred();
      const id = faker.string.uuid();
      const paymentId = faker.string.uuid();
      fetchMock.post(`https://joanie.endpoint/api/v1.0/orders/${id}/abort/`, deferrer.promise);

      const { result } = renderHook(() => useOmniscientOrders(undefined, { enabled: false }), {
        wrapper: Wrapper,
      });

      await waitFor(() => {
        expect(result.current).not.toBeNull();
      });

      await act(async () => {
        result.current.methods.abort({ id, payment_id: paymentId });
      });

      await waitFor(() => {
        expect(result.current.states.isPending).toBe(true);
      });
      expect(result.current.states.fetching).toBe(false);
      expect(result.current.states.aborting).toBe(true);

      await act(async () => {
        deferrer.resolve(HttpStatusCode.OK);
      });

      await waitFor(() => {
        expect(result.current.states.isPending).toBe(false);
      });
      expect(result.current.states.aborting).toBe(false);
    });

    it('manages abort mutation failure', async () => {
      const id = faker.string.uuid();
      fetchMock.post(
        `https://joanie.endpoint/api/v1.0/orders/${id}/abort/`,
        HttpStatusCode.INTERNAL_SERVER_ERROR,
      );

      const { result } = renderHook(() => useOmniscientOrders(undefined, { enabled: false }), {
        wrapper: Wrapper,
      });

      await waitFor(() => {
        expect(result.current).not.toBeNull();
      });

      expect(result.current.states.error).toBe(undefined);

      await act(async () => {
        await expect(
          result.current.methods.abort({
            id,
          }),
        ).rejects.toThrow('Internal Server Error');
      });

      expect(result.current.states.error).toBe('Cannot abort the order.');
      expect(result.current.states.isPending).toBe(false);
      expect(result.current.states.aborting).toBe(false);
    });

    it("set an order's payment method", async () => {
      const deferrer = new Deferred();
      const id = faker.string.uuid();
      const creditCardId = faker.string.uuid();
      fetchMock.post(
        `https://joanie.endpoint/api/v1.0/orders/${id}/payment-method/`,
        deferrer.promise,
      );

      const { result } = renderHook(() => useOmniscientOrders(undefined, { enabled: false }), {
        wrapper: Wrapper,
      });

      await waitFor(() => {
        expect(result.current).not.toBeNull();
      });

      await act(async () => {
        result.current.methods.set_payment_method({
          id,
          credit_card_id: creditCardId,
        });
      });

      await waitFor(() => {
        expect(result.current.states.isPending).toBe(true);
      });
      expect(result.current.states.fetching).toBe(false);
      expect(result.current.states.settingPaymentMethod).toBe(true);

      await act(async () => {
        deferrer.resolve(HttpStatusCode.OK);
      });

      await waitFor(() => {
        expect(result.current.states.isPending).toBe(false);
      });
      expect(result.current.states.settingPaymentMethod).toBe(false);
    });

    it('manages set payment method mutation failure', async () => {
      const id = faker.string.uuid();
      const creditCardId = faker.string.uuid();
      fetchMock.post(
        `https://joanie.endpoint/api/v1.0/orders/${id}/payment-method/`,
        HttpStatusCode.INTERNAL_SERVER_ERROR,
      );

      const { result } = renderHook(() => useOmniscientOrders(undefined, { enabled: false }), {
        wrapper: Wrapper,
      });

      await waitFor(() => {
        expect(result.current).not.toBeNull();
      });

      expect(result.current.states.error).toBe(undefined);

      await act(async () => {
        await expect(
          result.current.methods.set_payment_method({ id, credit_card_id: creditCardId }),
        ).rejects.toThrow('Internal Server Error');
      });

      expect(result.current.states.error).toBe("Cannot set the order's payment method.");
      expect(result.current.states.isPending).toBe(false);
      expect(result.current.states.aborting).toBe(false);
    });
  });

  describe('non-omniscient', () => {
    it('retrieves all the orders', async () => {
      const orders = CertificateOrderFactory().many(5);
      const deferrer = new Deferred<typeof orders>();
      fetchMock.get('https://joanie.endpoint/api/v1.0/orders/', deferrer.promise, {
        overwriteRoutes: true,
      });

      const { result } = renderHook(useOrders, {
        wrapper: Wrapper,
      });

      await waitFor(() => {
        expect(result.current.states.fetching).toBe(true);
      });
      expect(result.current.states.isPending).toBe(true);
      expect(result.current.states.isFetched).toBe(false);
      expect(result.current.states.creating).toBe(false);
      expect(result.current.items).toEqual([]);

      await act(async () => {
        deferrer.resolve(orders);
      });

      await waitFor(() => {
        expect(result.current.states.fetching).toBe(false);
      });
      expect(result.current.states.isPending).toBe(false);
      expect(result.current.states.isFetched).toBe(true);
      expect(result.current.states.creating).toBe(false);
      expect(result.current.items).toEqual(orders);
    });

    it('retrieves a specific order', async () => {
      const order = CertificateOrderFactory().one();
      const deferrer = new Deferred<typeof order>();
      fetchMock.get(`https://joanie.endpoint/api/v1.0/orders/${order.id}/`, deferrer.promise);

      const { result } = renderHook(() => useOrder(order.id), {
        wrapper: Wrapper,
      });

      await waitFor(() => {
        expect(result.current.states.fetching).toBe(true);
      });
      expect(result.current.states.isPending).toBe(true);
      expect(result.current.states.isFetched).toBe(false);
      expect(result.current.states.creating).toBe(false);
      expect(result.current.item).toEqual(undefined);

      await act(async () => {
        deferrer.resolve(order);
      });

      await waitFor(() => {
        expect(result.current.states.fetching).toBe(false);
      });
      expect(result.current.states.isPending).toBe(false);
      expect(result.current.states.isFetched).toBe(true);
      expect(result.current.states.creating).toBe(false);
      expect(result.current.item).toEqual(order);
    });

    it('has a method to submit an order', async () => {
      const { result } = renderHook(() => useOrders(undefined, { enabled: false }), {
        wrapper: Wrapper,
      });

      await waitFor(() => {
        expect(result.current.methods.submit).not.toBeUndefined();
      });
    });

    it('has a method to abort an order', async () => {
      const { result } = renderHook(() => useOrders(undefined, { enabled: false }), {
        wrapper: Wrapper,
      });

      await waitFor(() => {
        expect(result.current.methods.abort).not.toBeUndefined();
      });
    });

    it('has a method to set a payment method', async () => {
      const { result } = renderHook(() => useOrders(undefined, { enabled: false }), {
        wrapper: Wrapper,
      });

      await waitFor(() => {
        expect(result.current.methods.set_payment_method).not.toBeUndefined();
      });
    });
  });
});

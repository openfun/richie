import { QueryClientProvider } from '@tanstack/react-query';
import { IntlProvider } from 'react-intl';
import fetchMock from 'fetch-mock';
import { PropsWithChildren } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { faker } from '@faker-js/faker';
import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import { OrderFactory } from 'utils/test/factories/joanie';
import { SessionProvider } from 'contexts/SessionContext';
import { Deferred } from 'utils/test/deferred';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import { OrderState } from 'types/Joanie';
import useProductOrder from '.';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: { backend: 'fonzie', endpoint: 'https://demo.endpoint' },
    joanie_backend: { endpoint: 'https://joanie.endpoint' },
  }).one(),
}));

describe('useProductOrder', () => {
  let nbApiCalls: number;

  beforeEach(() => {
    fetchMock.get('https://joanie.endpoint/api/v1.0/credit-cards/', []);
    fetchMock.get('https://joanie.endpoint/api/v1.0/orders/', []);
    fetchMock.get('https://joanie.endpoint/api/v1.0/addresses/', []);
    nbApiCalls = 3;
  });

  afterEach(() => {
    jest.clearAllMocks();
    fetchMock.restore();
  });

  const Wrapper = ({ children }: PropsWithChildren) => {
    return (
      <QueryClientProvider client={createTestQueryClient({ user: true })}>
        <IntlProvider locale="en">
          <SessionProvider>{children}</SessionProvider>
        </IntlProvider>
      </QueryClientProvider>
    );
  };

  it.each([OrderState.PENDING, OrderState.VALIDATED, OrderState.SUBMITTED])(
    'should retrieves the last order when order.state is %s',
    async (currentState) => {
      // the most recent order of accepted state will be return
      const order = OrderFactory({
        state: currentState,
        created_on: new Date().toISOString(),
        course: '00000',
      }).one();
      const ordersByState = [OrderState.SUBMITTED, OrderState.PENDING, OrderState.VALIDATED]
        .filter((state) => state !== currentState)
        .map((state) =>
          OrderFactory({
            state,
            created_on: faker.date.past({ years: 1 }).toISOString(),
            course: '00000',
            product: order.product,
          }).one(),
        );
      ordersByState.push(order);

      const responseDeferred = new Deferred();
      fetchMock.get(
        `https://joanie.endpoint/api/v1.0/orders/?course=00000&product=${order.product}&state=pending&state=validated&state=submitted`,
        responseDeferred.promise,
      );

      const { result } = renderHook(
        () => useProductOrder({ productId: order.product, courseCode: '00000' }),
        {
          wrapper: Wrapper,
        },
      );

      await waitFor(() => {
        expect(result.current.states.fetching).toBe(true);
        expect(result.current.item).toBeUndefined();
      });
      nbApiCalls += 1; // call orders from useProductOrder
      const calledUrls = fetchMock.calls().map((call) => call[0]);
      expect(calledUrls).toHaveLength(nbApiCalls);
      expect(calledUrls).toContain(
        `https://joanie.endpoint/api/v1.0/orders/?course=00000&product=${order.product}&state=pending&state=validated&state=submitted`,
      );
      expect(result.current.states.creating).toBe(false);
      expect(result.current.states.deleting).toBeUndefined();
      expect(result.current.states.updating).toBeUndefined();
      expect(result.current.states.isLoading).toBe(true);
      expect(result.current.states.error).toBe(undefined);

      await act(async () => {
        responseDeferred.resolve(ordersByState);
      });

      await waitFor(() => {
        expect(result.current.states.fetching).toBe(false);
        expect(result.current.item).toEqual(order);
      });

      expect(result.current.states.creating).toBe(false);
      expect(result.current.states.deleting).toBeUndefined();
      expect(result.current.states.updating).toBeUndefined();
      expect(result.current.states.isLoading).toBe(false);
      expect(result.current.states.error).toBe(undefined);
    },
  );
});

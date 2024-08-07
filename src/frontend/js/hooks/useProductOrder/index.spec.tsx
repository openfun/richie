import { QueryClientProvider } from '@tanstack/react-query';
import { IntlProvider } from 'react-intl';
import fetchMock from 'fetch-mock';
import { PropsWithChildren } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { faker } from '@faker-js/faker';
import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import { CourseLightFactory, CredentialOrderFactory } from 'utils/test/factories/joanie';
import { SessionProvider } from 'contexts/SessionContext';
import { Deferred } from 'utils/test/deferred';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import { NOT_CANCELED_ORDER_STATES, OrderState } from 'types/Joanie';
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

  it.each([
    OrderState.DRAFT,
    OrderState.ASSIGNED,
    OrderState.TO_SIGN,
    OrderState.SIGNING,
    OrderState.TO_SAVE_PAYMENT_METHOD,
    OrderState.PENDING,
    OrderState.PENDING_PAYMENT,
    OrderState.NO_PAYMENT,
    OrderState.FAILED_PAYMENT,
    OrderState.COMPLETED,
  ])('should retrieves the last order when order.state is %s', async (currentState) => {
    // the most recent order of accepted state will be return
    const order = CredentialOrderFactory({
      state: currentState,
      created_on: new Date().toISOString(),
      course: CourseLightFactory({ code: '00000' }).one(),
    }).one();
    const ordersByState = NOT_CANCELED_ORDER_STATES.filter((state) => state !== currentState).map(
      (state) =>
        CredentialOrderFactory({
          state,
          created_on: faker.date.past({ years: 1 }).toISOString(),
          course: CourseLightFactory({ code: '00000' }).one(),
          product_id: order.product_id,
        }).one(),
    );
    ordersByState.push(order);

    const responseDeferred = new Deferred();
    const url =
      'https://joanie.endpoint/api/v1.0/orders/' +
      '?course_code=00000' +
      `&product_id=${order.product_id}` +
      `&state=${OrderState.PENDING}` +
      `&state=${OrderState.PENDING_PAYMENT}` +
      `&state=${OrderState.NO_PAYMENT}` +
      `&state=${OrderState.FAILED_PAYMENT}` +
      `&state=${OrderState.COMPLETED}` +
      `&state=${OrderState.DRAFT}` +
      `&state=${OrderState.ASSIGNED}` +
      `&state=${OrderState.TO_SIGN}` +
      `&state=${OrderState.SIGNING}` +
      `&state=${OrderState.TO_SAVE_PAYMENT_METHOD}`;
    fetchMock.get(url, responseDeferred.promise);

    const { result } = renderHook(
      () => useProductOrder({ productId: order.product_id, courseCode: '00000' }),
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
    expect(calledUrls).toContain(url);
    expect(result.current.states.creating).toBe(false);
    expect(result.current.states.deleting).toBeUndefined();
    expect(result.current.states.updating).toBeUndefined();
    expect(result.current.states.isPending).toBe(true);
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
    expect(result.current.states.isPending).toBe(false);
    expect(result.current.states.error).toBe(undefined);
  });
});

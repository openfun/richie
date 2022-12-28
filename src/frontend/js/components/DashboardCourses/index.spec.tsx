import { act, render, screen } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { IntlProvider } from 'react-intl';
import fetchMock from 'fetch-mock';
import * as mockFactories from 'utils/test/factories';
import { OrderFactory, ProductFactory } from 'utils/test/factories';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import { SessionProvider } from 'data/SessionProvider';
import { DashboardPaths } from 'utils/routers/dashboard';
import { Order, OrderState, Product } from 'types/Joanie';
import { DashboardTest } from '../Dashboard/DashboardTest';
import { resolveAll } from '../../utils/resolveAll';
import { Deferred } from '../../utils/test/deferred';
import { expectSpinner } from '../../utils/test/expectSpinner';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockFactories
    .ContextFactory({
      authentication: { backend: 'fonzie', endpoint: 'https://demo.endpoint' },
      joanie_backend: { endpoint: 'https://joanie.endpoint' },
    })
    .generate(),
}));

describe('<DashboardCourses/>', () => {
  beforeEach(() => {
    fetchMock.get('https://joanie.endpoint/api/v1.0/addresses/', []);
    fetchMock.get('https://joanie.endpoint/api/v1.0/credit-cards/', []);
  });

  afterEach(() => {
    jest.clearAllMocks();
    fetchMock.restore();
  });

  it('renders a list of orders', async () => {
    const orders: Order[] = OrderFactory.generate(5);
    const deferred = new Deferred();
    fetchMock.get('https://joanie.endpoint/api/v1.0/orders/', deferred.promise);
    const products: Product[] = ProductFactory.generate(5);
    orders.forEach((order, i) => {
      const product = products[i];
      product.id = order.product;
      fetchMock.get(
        'https://joanie.endpoint/api/v1.0/products/' + product.id + '/?course=' + order.course,
        product,
      );
    });

    await act(async () => {
      render(
        <QueryClientProvider client={createTestQueryClient({ user: true })}>
          <IntlProvider locale="en">
            <SessionProvider>
              <DashboardTest initialRoute={DashboardPaths.COURSES} />
            </SessionProvider>
          </IntlProvider>
        </QueryClientProvider>,
      );
    });

    await expectSpinner('Loading ...');

    await act(async () => {
      deferred.resolve({ results: orders, next: null, previous: null, count: null });
    });

    await resolveAll(orders, async (order, i) => {
      const product = products[i];
      await screen.findByRole('heading', { level: 5, name: product.title });
    });
  });

  it('does not render non validated orders', async () => {
    const orders: Order[] = OrderFactory.generate(4);
    orders[1].state = OrderState.CANCELED;
    orders[2].state = OrderState.FAILED;
    orders[3].state = OrderState.PENDING;

    fetchMock.get('https://joanie.endpoint/api/v1.0/orders/', {
      results: orders,
      next: null,
      previous: null,
      count: null,
    });
    const products: Product[] = ProductFactory.generate(5);
    orders.forEach((order, i) => {
      const product = products[i];
      product.id = order.product;
      fetchMock.get('https://joanie.endpoint/api/v1.0/products/' + product.id + '/', product);
    });
    await act(async () => {
      render(
        <QueryClientProvider client={createTestQueryClient({ user: true })}>
          <IntlProvider locale="en">
            <SessionProvider>
              <DashboardTest initialRoute={DashboardPaths.COURSES} />
            </SessionProvider>
          </IntlProvider>
        </QueryClientProvider>,
      );
    });

    await screen.findByTestId('dashboard-item-order-' + orders[0].id);
    expect(screen.queryByTestId('dashboard-item-order-' + orders[1].id)).toBeNull();
    expect(screen.queryByTestId('dashboard-item-order-' + orders[2].id)).toBeNull();
    expect(screen.queryByTestId('dashboard-item-order-' + orders[3].id)).toBeNull();
  });
});

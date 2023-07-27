import { findByRole, render, screen, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { IntlProvider } from 'react-intl';
import fetchMock from 'fetch-mock';
import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import { Order } from 'types/Joanie';
import { OrderFactory, TargetCourseFactory } from 'utils/test/factories/joanie';
import { mockProductWithOrder } from 'utils/test/mockProductWithOrder';
import { LearnerDashboardPaths } from 'widgets/Dashboard/utils/learnerRouteMessages';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import { SessionProvider } from 'contexts/SessionContext';
import { DashboardTest } from 'widgets/Dashboard/components/DashboardTest';
import { expectUrlMatchLocationDisplayed } from 'utils/test/expectUrlMatchLocationDisplayed';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: { backend: 'fonzie', endpoint: 'https://demo.endpoint' },
    joanie_backend: { endpoint: 'https://joanie.endpoint' },
  }).one(),
}));

describe('<DashboardOrderLayout />', () => {
  const WrapperWithDashboard = (route: string) => {
    return (
      <QueryClientProvider client={createTestQueryClient({ user: true })}>
        <IntlProvider locale="en">
          <SessionProvider>
            <DashboardTest initialRoute={route} />
          </SessionProvider>
        </IntlProvider>
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    fetchMock.get('https://joanie.endpoint/api/v1.0/addresses/', []);
    fetchMock.get('https://joanie.endpoint/api/v1.0/credit-cards/', []);
    fetchMock.get('https://joanie.endpoint/api/v1.0/orders/', []);
    fetchMock.get('https://joanie.endpoint/api/v1.0/enrollments/', []);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
    fetchMock.restore();
  });

  it('renders sidebar', async () => {
    const order: Order = {
      ...OrderFactory().one(),
      target_courses: [TargetCourseFactory().one()],
      enrollments: [],
    };
    const product = mockProductWithOrder(order);
    fetchMock.get(
      'https://joanie.endpoint/api/v1.0/orders/',
      { results: [order], next: null, previous: null, count: null },
      { overwriteRoutes: true },
    );

    render(WrapperWithDashboard(LearnerDashboardPaths.ORDER.replace(':orderId', order.id)));

    await waitFor(() =>
      expectUrlMatchLocationDisplayed(LearnerDashboardPaths.ORDER.replace(':orderId', order.id)),
    );

    const sidebar = screen.getByTestId('dashboard__sidebar');
    await findByRole(sidebar, 'heading', { name: product.title });

    screen.getByRole('link', {
      name: 'General information',
    });
  });
});

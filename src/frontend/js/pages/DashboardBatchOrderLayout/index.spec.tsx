import { findByRole, render, screen, waitFor } from '@testing-library/react';
import { generatePath } from 'react-router';
import fetchMock from 'fetch-mock';
import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import { BatchOrderReadFactory, BatchOrderSeatFactory } from 'utils/test/factories/joanie';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import { DashboardTest } from 'widgets/Dashboard/components/DashboardTest';
import { expectUrlMatchLocationDisplayed } from 'utils/test/expectUrlMatchLocationDisplayed';
import { LearnerDashboardPaths } from 'widgets/Dashboard/utils/learnerRoutesPaths';
import { BaseJoanieAppWrapper } from 'utils/test/wrappers/BaseJoanieAppWrapper';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: { backend: 'fonzie', endpoint: 'https://demo.endpoint' },
    joanie_backend: { endpoint: 'https://joanie.endpoint' },
  }).one(),
}));

jest.mock('settings', () => ({
  __esModule: true,
  ...jest.requireActual('settings'),
  PER_PAGE: { useBatchOrders: 10 },
}));

describe('<DashboardBatchOrderLayout />', () => {
  const WrapperWithDashboard = (route: string) => {
    const client = createTestQueryClient({ user: true });
    return (
      <BaseJoanieAppWrapper queryOptions={{ client }}>
        <DashboardTest initialRoute={route} />
      </BaseJoanieAppWrapper>
    );
  };

  beforeEach(() => {
    fetchMock.get('https://joanie.endpoint/api/v1.0/addresses/', []);
    fetchMock.get('https://joanie.endpoint/api/v1.0/credit-cards/', []);
    fetchMock.get('https://joanie.endpoint/api/v1.0/orders/', []);
    fetchMock.get('https://joanie.endpoint/api/v1.0/enrollments/', []);
    fetchMock.get('https://joanie.endpoint/api/v1.0/batch-orders/', []);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
    fetchMock.restore();
  });

  it('renders sidebar', async () => {
    const batchOrder = BatchOrderReadFactory().one();
    const seats = BatchOrderSeatFactory().many(2);
    fetchMock.get(`https://joanie.endpoint/api/v1.0/batch-orders/${batchOrder.id}/`, batchOrder);
    fetchMock.get(`https://joanie.endpoint/api/v1.0/batch-orders/${batchOrder.id}/seats/`, seats);

    render(
      WrapperWithDashboard(
        generatePath(LearnerDashboardPaths.BATCH_ORDER, {
          batchOrderId: batchOrder.id,
        }),
      ),
    );

    await waitFor(() =>
      expectUrlMatchLocationDisplayed(
        generatePath(LearnerDashboardPaths.BATCH_ORDER, {
          batchOrderId: batchOrder.id,
        }),
      ),
    );

    const sidebar = screen.getByTestId('dashboard__sidebar');
    await findByRole(sidebar, 'heading');

    screen.getByRole('link', {
      name: 'General information',
    });
  });
});

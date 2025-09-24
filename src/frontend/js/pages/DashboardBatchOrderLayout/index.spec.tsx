import { findByRole, render, screen } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import { BatchOrderReadFactory } from 'utils/test/factories/joanie';
import { DashboardTest } from 'widgets/Dashboard/components/DashboardTest';
import { LearnerDashboardPaths } from 'widgets/Dashboard/utils/learnerRoutesPaths';
import { BaseJoanieAppWrapper } from 'utils/test/wrappers/BaseJoanieAppWrapper';
import { setupJoanieSession } from 'utils/test/wrappers/JoanieAppWrapper';

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
  setupJoanieSession();

  it('renders sidebar', async () => {
    const batchOrders = BatchOrderReadFactory().many(3);

    fetchMock.get(`https://joanie.endpoint/api/v1.0/batch-orders/?page=1&page_size=10`, {
      results: batchOrders,
      count: batchOrders.length,
      next: null,
      previous: null,
    });

    render(<DashboardTest initialRoute={LearnerDashboardPaths.BATCH_ORDERS} />, {
      wrapper: BaseJoanieAppWrapper,
    });

    const sidebar = screen.getByTestId('dashboard__sidebar');
    await findByRole(sidebar, 'heading');

    screen.getByRole('link', {
      name: 'General information',
    });
  });
});

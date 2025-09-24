import { act, screen, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import userEvent from '@testing-library/user-event';
import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import { DashboardTest } from 'widgets/Dashboard/components/DashboardTest';
import { BatchOrderReadFactory } from 'utils/test/factories/joanie';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import { expectSpinner, expectNoSpinner } from 'utils/test/expectSpinner';
import { expectBannerError, expectBannerInfo, expectNoBannerInfo } from 'utils/test/expectBanner';
import { Deferred } from 'utils/test/deferred';
import { noop } from 'utils';
import { HttpStatusCode } from 'utils/errors/HttpError';
import { setupJoanieSession } from 'utils/test/wrappers/JoanieAppWrapper';
import { render } from 'utils/test/render';
import { BaseJoanieAppWrapper } from 'utils/test/wrappers/BaseJoanieAppWrapper';
import { LearnerDashboardPaths } from 'widgets/Dashboard/utils/learnerRoutesPaths';
import { BatchOrderState } from 'types/Joanie';

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

describe('<DashboardBatchOrders/>', () => {
  setupJoanieSession();
  const perPage = 10;

  afterEach(() => {
    fetchMock.restore();
  });

  it('renders an empty placeholder', async () => {
    const deferred = new Deferred();
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/batch-orders/?page=1&page_size=${perPage}`,
      deferred.promise,
    );

    render(<DashboardTest initialRoute={LearnerDashboardPaths.BATCH_ORDERS} />, {
      wrapper: BaseJoanieAppWrapper,
    });

    await expectSpinner('Loading batch orders...');
    await expectNoBannerInfo('You have no batch orders yet.');

    act(() => {
      deferred.resolve({ results: [], count: 0, next: null, previous: null });
    });

    await expectNoSpinner('Loading batch orders...');
    await expectBannerInfo('You have no batch orders yet.');
  });

  it('renders a list of batch orders and excludes canceled ones', async () => {
    const batchOrders = [
      ...BatchOrderReadFactory().many(3),
      BatchOrderReadFactory({ state: BatchOrderState.CANCELED }).one(),
    ];

    fetchMock.get(`https://joanie.endpoint/api/v1.0/batch-orders/?page=1&page_size=${perPage}`, {
      results: batchOrders,
      count: batchOrders.length,
      next: null,
      previous: null,
    });

    render(<DashboardTest initialRoute={LearnerDashboardPaths.BATCH_ORDERS} />, {
      wrapper: BaseJoanieAppWrapper,
    });

    await expectNoSpinner('Loading batch orders...');
    await expectNoBannerInfo('You have no batch orders yet.');

    const items = screen.getAllByTestId('batch-order-enrollment-list-item');
    expect(items).toHaveLength(3);
  });

  it.only('renders pagination and loads next page', async () => {
    const total = perPage + 3;
    const batchOrders = BatchOrderReadFactory().many(total);

    fetchMock.get(`https://joanie.endpoint/api/v1.0/batch-orders/?page=1&page_size=${perPage}`, {
      results: batchOrders.slice(0, perPage),
      count: total,
      next: `https://joanie.endpoint/api/v1.0/batch-orders/?page=2&page_size=${perPage}`,
      previous: null,
    });

    fetchMock.get(`https://joanie.endpoint/api/v1.0/batch-orders/?page=2&page_size=${perPage}`, {
      results: batchOrders.slice(perPage, total),
      count: total,
      next: null,
      previous: `https://joanie.endpoint/api/v1.0/batch-orders/?page=1&page_size=${perPage}`,
    });

    render(<DashboardTest initialRoute={LearnerDashboardPaths.BATCH_ORDERS} />, {
      wrapper: BaseJoanieAppWrapper,
    });

    await expectNoSpinner('Loading batch orders...');
    let items = screen.getAllByTestId('batch-order-enrollment-list-item');
    expect(items).toHaveLength(perPage);

    const nextPageLink = screen.getByRole('link', { name: 'Next page 2' });
    await userEvent.click(nextPageLink);

    await waitFor(() => {
      items = screen.getAllByTestId('batch-order-enrollment-list-item');
      expect(items).toHaveLength(total - perPage);
    });
  });

  it('shows an error', async () => {
    jest.spyOn(console, 'error').mockImplementation(noop);
    const deferred = new Deferred();
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/batch-orders/?page=1&page_size=${perPage}`,
      deferred.promise,
    );

    render(<DashboardTest initialRoute={LearnerDashboardPaths.BATCH_ORDERS} />, {
      wrapper: BaseJoanieAppWrapper,
    });

    deferred.resolve({
      status: HttpStatusCode.INTERNAL_SERVER_ERROR,
      body: 'Internal Server Error',
    });

    await expectNoSpinner('Loading orders and enrollments...');
    await expectBannerError('An error occurred while fetching batch orders. Please retry later.');
  });
});

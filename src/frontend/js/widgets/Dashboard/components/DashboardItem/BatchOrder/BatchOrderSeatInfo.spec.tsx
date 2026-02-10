import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import { BatchOrderReadFactory, BatchOrderSeatFactory } from 'utils/test/factories/joanie';
import { BatchOrderState } from 'types/Joanie';
import { HttpStatusCode } from 'utils/errors/HttpError';
import { setupJoanieSession } from 'utils/test/wrappers/JoanieAppWrapper';
import { render } from 'utils/test/render';
import { expectBannerError } from 'utils/test/expectBanner';
import { BatchOrderSeatInfo } from './BatchOrderSeatInfo';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: { backend: 'fonzie', endpoint: 'https://auth.test' },
    joanie_backend: { endpoint: 'https://joanie.endpoint' },
  }).one(),
}));

describe('<BatchOrderSeatInfo />', () => {
  setupJoanieSession();

  const paginatedResponse = (results: object[], count?: number) => ({
    results,
    count: count ?? results.length,
    next: null,
    previous: null,
  });

  it('renders enrollment progress and seat list, and searches by query param', async () => {
    const ownedSeat = BatchOrderSeatFactory({ owner_name: 'Alice Martin' }).one();
    const voucherSeat = BatchOrderSeatFactory().one();
    const batchOrder = BatchOrderReadFactory({
      state: BatchOrderState.COMPLETED,
      nb_seats: 10,
      seats_owned: 1,
      seats_to_own: 9,
    }).one();

    fetchMock.get(
      `begin:https://joanie.endpoint/api/v1.0/batch-orders/${batchOrder.id}/seats/`,
      paginatedResponse([ownedSeat, voucherSeat], 10),
    );

    render(<BatchOrderSeatInfo batchOrder={batchOrder} />);

    expect(await screen.findByText('1/10 enrolled participants')).toBeVisible();
    expect(await screen.findByText('Alice Martin')).toBeVisible();
    expect(await screen.findByText(voucherSeat.voucher!)).toBeVisible();

    const user = userEvent.setup();
    await user.type(screen.getByRole('textbox'), 'Alice');

    await waitFor(() => {
      const urls = fetchMock
        .calls(`begin:https://joanie.endpoint/api/v1.0/batch-orders/${batchOrder.id}/seats/`)
        .map(([url]) => url);
      expect(urls.some((url) => url.includes('query=Alice'))).toBe(true);
    });
  });

  it('loads more seats when clicking the load more button', async () => {
    const firstPage = BatchOrderSeatFactory().many(10);
    const secondPage = BatchOrderSeatFactory().many(5);
    const batchOrder = BatchOrderReadFactory({
      state: BatchOrderState.COMPLETED,
      nb_seats: 15,
      seats_owned: 15,
      seats_to_own: 0,
    }).one();

    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/batch-orders/${batchOrder.id}/seats/?page=1&page_size=10`,
      { results: firstPage, count: 15, next: 'next-url', previous: null },
    );
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/batch-orders/${batchOrder.id}/seats/?page=2&page_size=10`,
      { results: secondPage, count: 15, next: null, previous: 'prev-url' },
    );

    render(<BatchOrderSeatInfo batchOrder={batchOrder} />);

    expect(await screen.findByText(firstPage[0].owner_name ?? firstPage[0].voucher!)).toBeVisible();
    expect(screen.queryByText(secondPage[0].owner_name ?? secondPage[0].voucher!)).toBeNull();
    expect(screen.getByRole('button', { name: 'Load 5 more' })).toBeVisible();

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Load 5 more' }));

    expect(
      await screen.findByText(secondPage[0].owner_name ?? secondPage[0].voucher!),
    ).toBeVisible();
    expect(screen.queryByText('Load 5 more')).toBeNull();
    expect(screen.getByText(firstPage[0].owner_name ?? firstPage[0].voucher!)).toBeVisible();
  });

  it('shows an error banner when the seats API fails', async () => {
    const batchOrder = BatchOrderReadFactory({
      state: BatchOrderState.COMPLETED,
      nb_seats: 10,
      seats_owned: 1,
      seats_to_own: 9,
    }).one();

    fetchMock.get(`begin:https://joanie.endpoint/api/v1.0/batch-orders/${batchOrder.id}/seats/`, {
      status: HttpStatusCode.INTERNAL_SERVER_ERROR,
    });

    render(<BatchOrderSeatInfo batchOrder={batchOrder} />);

    await expectBannerError('An error occurred while fetching resources. Please retry later.');
  });
});

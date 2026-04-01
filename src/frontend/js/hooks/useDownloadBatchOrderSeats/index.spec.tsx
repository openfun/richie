import fetchMock from 'fetch-mock';
import { PropsWithChildren } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { IntlProvider } from 'react-intl';
import { act, fireEvent, renderHook, waitFor } from '@testing-library/react';
import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import { useDownloadBatchOrderSeats } from 'hooks/useDownloadBatchOrderSeats/index';
import { handle } from 'utils/errors/handle';
import { SessionProvider } from 'contexts/SessionContext';
import { Deferred } from 'utils/test/deferred';
import { BatchOrderReadFactory } from 'utils/test/factories/joanie';
import { HttpStatusCode } from 'utils/errors/HttpError';

jest.mock('utils/errors/handle');
jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: { backend: 'fonzie', endpoint: 'https://auth.test' },
    joanie_backend: { endpoint: 'https://joanie.test' },
  }).one(),
}));

const mockHandle = handle as jest.MockedFn<typeof handle>;

describe('useDownloadBatchOrderSeats', () => {
  beforeEach(() => {
    fetchMock.get('https://joanie.test/api/v1.0/orders/', []);
    fetchMock.get('https://joanie.test/api/v1.0/addresses/', []);
    fetchMock.get('https://joanie.test/api/v1.0/credit-cards/', []);
  });

  beforeAll(() => {
    // eslint-disable-next-line compat/compat
    URL.createObjectURL = jest.fn();
    // eslint-disable-next-line compat/compat
    URL.revokeObjectURL = jest.fn();
    HTMLAnchorElement.prototype.click = jest.fn();
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

  it('downloads the batch order seats CSV', async () => {
    const batchOrder = BatchOrderReadFactory().one();
    const DOWNLOAD_URL = `https://joanie.test/api/v1.0/batch-orders/${batchOrder.id}/seats-export/`;
    const deferred = new Deferred();
    fetchMock.get(DOWNLOAD_URL, deferred.promise);

    const { result } = renderHook(() => useDownloadBatchOrderSeats(), {
      wrapper: Wrapper,
    });
    await waitFor(() => expect(result.current).not.toBeNull());

    expect(fetchMock.called(DOWNLOAD_URL)).toBe(false);
    // eslint-disable-next-line compat/compat
    expect(URL.createObjectURL).toHaveBeenCalledTimes(0);
    // eslint-disable-next-line compat/compat
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(0);
    expect(result.current.loading).toBe(false);

    act(() => {
      result.current.download(batchOrder.id);
    });
    expect(result.current.loading).toBe(true);

    deferred.resolve({
      status: HttpStatusCode.OK,
      body: new Blob(['last_name,first_name,email']),
      headers: {
        'Content-Type': 'text/csv',
      },
    });

    await waitFor(() => {
      expect(fetchMock.called(DOWNLOAD_URL)).toBe(true);
      // eslint-disable-next-line compat/compat
      expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
      // eslint-disable-next-line compat/compat
      expect(URL.revokeObjectURL).toHaveBeenCalledTimes(0);
      expect(result.current.loading).toBe(false);
    });

    fireEvent.blur(window);
    // eslint-disable-next-line compat/compat
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(1);
  });

  it('handles an error if seats export request fails', async () => {
    const batchOrder = BatchOrderReadFactory().one();
    const DOWNLOAD_URL = `https://joanie.test/api/v1.0/batch-orders/${batchOrder.id}/seats-export/`;
    fetchMock.get(DOWNLOAD_URL, HttpStatusCode.UNAUTHORIZED);

    const { result } = renderHook(() => useDownloadBatchOrderSeats(), {
      wrapper: Wrapper,
    });
    await waitFor(() => expect(result.current).not.toBeNull());

    expect(fetchMock.called(DOWNLOAD_URL)).toBe(false);
    expect(mockHandle).not.toHaveBeenCalled();
    // eslint-disable-next-line compat/compat
    expect(URL.createObjectURL).toHaveBeenCalledTimes(0);
    // eslint-disable-next-line compat/compat
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(0);

    act(() => {
      result.current.download(batchOrder.id);
    });

    await waitFor(() => {
      expect(fetchMock.called(DOWNLOAD_URL)).toBe(true);
      expect(mockHandle).toHaveBeenNthCalledWith(1, new Error('Unauthorized'));
      // eslint-disable-next-line compat/compat
      expect(URL.createObjectURL).toHaveBeenCalledTimes(0);
      // eslint-disable-next-line compat/compat
      expect(URL.revokeObjectURL).toHaveBeenCalledTimes(0);
      expect(result.current.loading).toBe(false);
    });
  });
});

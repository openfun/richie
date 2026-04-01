import { faker } from '@faker-js/faker';
import fetchMock from 'fetch-mock';
import { PropsWithChildren } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { IntlProvider } from 'react-intl';
import { act, fireEvent, renderHook, waitFor } from '@testing-library/react';
import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import { useDownloadAgreement } from 'hooks/useDownloadAgreement/index';
import { handle } from 'utils/errors/handle';
import { SessionProvider } from 'contexts/SessionContext';
import { Deferred } from 'utils/test/deferred';
import { OrganizationFactory } from 'utils/test/factories/joanie';
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

describe('useDownloadAgreement', () => {
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

  it('downloads the agreement PDF', async () => {
    const organization = OrganizationFactory().one();
    const agreementId = faker.string.uuid();
    const DOWNLOAD_URL = `https://joanie.test/api/v1.0/organizations/${organization.id}/agreements/${agreementId}/download/`;
    const deferred = new Deferred();
    fetchMock.get(DOWNLOAD_URL, deferred.promise);

    const { result } = renderHook(() => useDownloadAgreement(), {
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
      result.current.download(organization.id, agreementId);
    });
    expect(result.current.loading).toBe(true);

    deferred.resolve({
      status: HttpStatusCode.OK,
      body: new Blob(['%PDF-1.4']),
      headers: {
        'Content-Disposition': 'attachment; filename="Convention_de_formation.pdf";',
        'Content-Type': 'application/pdf',
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

  it('handles an error if agreement download request fails', async () => {
    const organization = OrganizationFactory().one();
    const agreementId = faker.string.uuid();
    const DOWNLOAD_URL = `https://joanie.test/api/v1.0/organizations/${organization.id}/agreements/${agreementId}/download/`;
    fetchMock.get(DOWNLOAD_URL, HttpStatusCode.UNAUTHORIZED);

    const { result } = renderHook(() => useDownloadAgreement(), {
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
      result.current.download(organization.id, agreementId);
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

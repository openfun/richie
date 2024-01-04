import { faker } from '@faker-js/faker';
import fetchMock from 'fetch-mock';
import { act, renderHook, waitFor } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { PropsWithChildren } from 'react';
import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import JoanieApiProvider from 'contexts/JoanieApiContext';
import {
  storeContractArchiveId,
  unstoreContractArchiveId,
} from '../useDownloadContractArchive/contractArchiveLocalStorage';
import useCheckContractArchiveExists from '.';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: { backend: 'fonzie', endpoint: 'https://auth.test' },
    joanie_backend: { endpoint: 'https://joanie.test' },
  }).one(),
}));

jest.mock('settings', () => ({
  ...jest.requireActual('settings'),
  CONTRACT_DOWNLOAD_SETTINGS: {
    ...jest.requireActual('settings').CONTRACT_DOWNLOAD_SETTINGS,
    pollInterval: 100,
  },
}));

const mockCheckArchive = jest.fn();
jest.mock('hooks/useContractArchive', () => ({
  __esModule: true,
  default: () => ({
    methods: { get: jest.fn(), create: jest.fn(), check: mockCheckArchive },
  }),
}));

describe('useCheckContractArchiveExists', () => {
  const Wrapper = ({ children }: PropsWithChildren) => {
    return (
      <IntlProvider locale="en">
        <JoanieApiProvider>{children}</JoanieApiProvider>
      </IntlProvider>
    );
  };
  beforeEach(() => {
    // Joanie providers calls
    fetchMock.get('https://joanie.test/api/v1.0/orders/', []);
    fetchMock.get('https://joanie.test/api/v1.0/credit-cards/', []);
    fetchMock.get('https://joanie.test/api/v1.0/addresses/', []);
  });

  afterEach(() => {
    jest.resetAllMocks();
    fetchMock.restore();
    unstoreContractArchiveId();
  });

  it('should do nothing and return default value when no contractArchiveId is stored', () => {
    const { result } = renderHook(useCheckContractArchiveExists, {
      wrapper: Wrapper,
    });

    expect(result.current.isContractArchiveExists).toBe(false);
    expect(mockCheckArchive).not.toHaveBeenCalled();
  });

  it('should check if archive exist when a id is stored', async () => {
    storeContractArchiveId(faker.string.uuid());
    mockCheckArchive.mockResolvedValue(true);

    const { result } = renderHook(useCheckContractArchiveExists, {
      wrapper: Wrapper,
    });

    expect(result.current.isContractArchiveExists).toBeNull();
    await waitFor(() => {
      expect(mockCheckArchive).toHaveBeenCalledTimes(1);
    });

    expect(result.current.isPolling).toBe(false);
    expect(result.current.isContractArchiveExists).toBe(true);
  });

  it('should do nothing when enable is false', () => {
    storeContractArchiveId(faker.string.uuid());
    mockCheckArchive.mockResolvedValue(true);

    const { result } = renderHook(() => useCheckContractArchiveExists({ enable: false }), {
      wrapper: Wrapper,
    });

    expect(result.current.isContractArchiveExists).toBe(false);
    expect(mockCheckArchive).not.toHaveBeenCalled();
  });

  it('should trigger polling when checkArchiveExist is call', async () => {
    const { result, rerender } = renderHook(useCheckContractArchiveExists, {
      wrapper: Wrapper,
    });

    mockCheckArchive.mockResolvedValue(false);
    act(() => {
      result.current.checkArchiveExists(faker.string.uuid());
    });

    await waitFor(() => {
      expect(mockCheckArchive).toHaveBeenCalledTimes(1);
    });

    expect(result.current.isContractArchiveExists).toBe(false);

    // isPolling it need's a rerender to be updated
    rerender();
    expect(result.current.isPolling).toBe(true);

    mockCheckArchive.mockResolvedValue(true);
    await waitFor(() => {
      expect(mockCheckArchive).toHaveBeenCalledTimes(2);
    });
    expect(result.current.isPolling).toBe(false);
    expect(result.current.isContractArchiveExists).toBe(true);
  });
});

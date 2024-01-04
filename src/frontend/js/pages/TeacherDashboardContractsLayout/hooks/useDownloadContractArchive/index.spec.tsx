import { faker } from '@faker-js/faker';
import { act, renderHook, waitFor } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { PropsWithChildren } from 'react';
import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import JoanieApiProvider from 'contexts/JoanieApiContext';
import { CONTRACT_DOWNLOAD_SETTINGS } from 'settings';
import {
  getStoredContractArchiveId,
  storeContractArchiveId,
  unstoreContractArchiveId,
} from './contractArchiveLocalStorage';
import useDownloadContractArchive, { ContractDownloadStatus } from '.';

jest.mock('settings', () => ({
  ...jest.requireActual('settings'),
  CONTRACT_DOWNLOAD_SETTINGS: {
    ...jest.requireActual('settings').CONTRACT_DOWNLOAD_SETTINGS,
    pollInterval: 100,
  },
}));

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: { backend: 'fonzie', endpoint: 'https://auth.test' },
    joanie_backend: { endpoint: 'https://joanie.test' },
  }).one(),
}));

const mockCheckArchive = jest.fn();
const mockCreateArchive = jest.fn();
const mockGetArchive = jest.fn();
jest.mock('hooks/useContractArchive', () => ({
  __esModule: true,
  default: () => ({
    methods: { get: mockGetArchive, create: mockCreateArchive, check: mockCheckArchive },
  }),
}));

let mockHasContractToDownload: boolean;
jest.mock('pages/TeacherDashboardContractsLayout/hooks/useHasContractToDownload/index.tsx', () => ({
  __esModule: true,
  default: () => mockHasContractToDownload,
}));

describe('useDownloadContractArchive', () => {
  let organizationId: string;
  const Wrapper = ({ children }: PropsWithChildren) => {
    return (
      <IntlProvider locale="en">
        <JoanieApiProvider>{children}</JoanieApiProvider>
      </IntlProvider>
    );
  };

  afterEach(() => {
    jest.resetAllMocks();
    unstoreContractArchiveId();
  });

  describe('with no contract available for download', () => {
    beforeEach(() => {
      organizationId = faker.string.uuid();
      mockHasContractToDownload = false;
    });

    it('should return IDLE status when no contractArchiveId is stored', async () => {
      const { result } = renderHook(() => useDownloadContractArchive({ organizationId }), {
        wrapper: Wrapper,
      });
      expect(result.current.status).toBe(ContractDownloadStatus.IDLE);

      // no api call should have been done.
      expect(mockCheckArchive).not.toHaveBeenCalled();
      expect(mockGetArchive).not.toHaveBeenCalled();
      expect(mockCreateArchive).not.toHaveBeenCalled();
    });

    it('should return IDLE status when contractArchiveId is stored', async () => {
      const contractArchiveId = faker.string.uuid();
      storeContractArchiveId(contractArchiveId);

      const { result } = renderHook(() => useDownloadContractArchive({ organizationId }), {
        wrapper: Wrapper,
      });

      expect(result.current.status).toBe(ContractDownloadStatus.IDLE);

      // no api call should have been done.
      expect(mockCheckArchive).not.toHaveBeenCalled();
      expect(mockGetArchive).not.toHaveBeenCalled();
      expect(mockCreateArchive).not.toHaveBeenCalled();
    });
  });

  describe('with contracts available for download', () => {
    beforeEach(() => {
      organizationId = faker.string.uuid();
      mockHasContractToDownload = true;
    });

    it('should return IDLE status when no contractArchiveId is stored', async () => {
      const { result } = renderHook(() => useDownloadContractArchive({ organizationId }), {
        wrapper: Wrapper,
      });

      // ensure that initial effects are done
      expect(result.current.status).toBe(ContractDownloadStatus.IDLE);

      // no api call should have been done.
      expect(mockCheckArchive).not.toHaveBeenCalled();
      expect(mockGetArchive).not.toHaveBeenCalled();
      expect(mockCreateArchive).not.toHaveBeenCalled();
    });

    it('should return PENDING status when a contractArchiveId is stored', async () => {
      const contractArchiveId = faker.string.uuid();
      storeContractArchiveId(contractArchiveId);
      mockCheckArchive.mockResolvedValue(false);

      const { result } = renderHook(() => useDownloadContractArchive({ organizationId }), {
        wrapper: Wrapper,
      });

      await waitFor(() => {
        expect(result.current.status).toBe(ContractDownloadStatus.PENDING);
      });

      expect(mockCheckArchive).toHaveBeenCalledTimes(1);
      expect(mockGetArchive).not.toHaveBeenCalled();
      expect(mockCreateArchive).not.toHaveBeenCalled();
    });

    it('should return READY status when a contractArchiveId is stored and it exists on the server', async () => {
      const contractArchiveId = faker.string.uuid();
      storeContractArchiveId(contractArchiveId);
      mockCheckArchive.mockResolvedValue(true);

      const { result } = renderHook(() => useDownloadContractArchive({ organizationId }), {
        wrapper: Wrapper,
      });

      // ensure that initial effects are done
      await waitFor(() => {
        expect(result.current.status).toBe(ContractDownloadStatus.READY);
      });

      expect(mockCheckArchive).toHaveBeenCalledTimes(1);
      expect(mockGetArchive).not.toHaveBeenCalled();
      expect(mockCreateArchive).not.toHaveBeenCalled();
    });

    it("doDownloadArchive should call 'getArchive' if the archive is ready for download", async () => {
      const contractArchiveId = faker.string.uuid();
      storeContractArchiveId(contractArchiveId);
      mockCheckArchive.mockResolvedValue(true);

      const { result } = renderHook(() => useDownloadContractArchive({ organizationId }), {
        wrapper: Wrapper,
      });

      // ensure that initial effects are done
      await waitFor(() => {
        expect(result.current.status).toBe(ContractDownloadStatus.READY);
      });
      expect(mockCheckArchive).toHaveBeenCalledTimes(1);

      act(() => {
        result.current.downloadContractArchive();
      });

      await waitFor(() => {
        expect(result.current.status).toBe(ContractDownloadStatus.IDLE);
      });

      expect(mockCheckArchive).toHaveBeenCalledTimes(1);
      // backend is called to download the archive
      expect(mockGetArchive).toHaveBeenCalledTimes(1);

      // but not to generate the archive
      expect(mockCreateArchive).not.toHaveBeenCalled();
    });

    it("doDownloadArchive should call 'createArchive' if no contractArchiveId is stored", async () => {
      const { result } = renderHook(() => useDownloadContractArchive({ organizationId }), {
        wrapper: Wrapper,
      });

      mockCheckArchive.mockResolvedValue(true);
      mockCreateArchive.mockResolvedValue(faker.string.uuid());
      act(() => {
        result.current.downloadContractArchive();
      });

      await waitFor(() => {
        expect(result.current.status).toBe(ContractDownloadStatus.IDLE);
      });

      expect(mockCreateArchive).toHaveBeenCalledTimes(1);
      expect(mockCheckArchive).toHaveBeenCalledTimes(1);
      expect(mockGetArchive).toHaveBeenCalledTimes(1);
    });
  });

  describe('with contracts available for download and expired contractArchiveId', () => {
    let contractArchiveId: string;
    beforeEach(() => {
      organizationId = faker.string.uuid();
      mockHasContractToDownload = true;

      const now = Date.now();
      const unvalidCreationTime =
        now - CONTRACT_DOWNLOAD_SETTINGS.contractArchiveLocalVaklidityDurationMs * 2;

      jest.useFakeTimers();
      jest.setSystemTime(new Date(unvalidCreationTime));
      contractArchiveId = faker.string.uuid();
      storeContractArchiveId(contractArchiveId);
      jest.setSystemTime(new Date(now));
    });

    afterEach(() => {
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
    });

    it('should return READY status when archive exists on the server', async () => {
      mockCheckArchive.mockResolvedValue(true);

      const { result } = renderHook(() => useDownloadContractArchive({ organizationId }), {
        wrapper: Wrapper,
      });

      // ensure that initial effects are done
      await waitFor(() => {
        expect(result.current.status).toBe(ContractDownloadStatus.READY);
      });

      expect(getStoredContractArchiveId()).toBe(contractArchiveId);

      expect(mockCheckArchive).toHaveBeenCalledTimes(1);
      expect(mockGetArchive).not.toHaveBeenCalled();
      expect(mockCreateArchive).not.toHaveBeenCalled();
    });

    it("should return IDLE status and clear stored id when archive doesn't exists on the server", async () => {
      mockCheckArchive.mockResolvedValue(false);

      const { result } = renderHook(() => useDownloadContractArchive({ organizationId }), {
        wrapper: Wrapper,
      });

      // ensure that initial effects are done
      await waitFor(() => {
        expect(result.current.status).toBe(ContractDownloadStatus.IDLE);
      });

      expect(getStoredContractArchiveId()).toBe(null);

      expect(mockCheckArchive).toHaveBeenCalledTimes(1);
      expect(mockGetArchive).not.toHaveBeenCalled();
      expect(mockCreateArchive).not.toHaveBeenCalled();
    });
  });
});

import { faker } from '@faker-js/faker';
import fetchMock from 'fetch-mock';
import { act, renderHook, waitFor } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { PropsWithChildren } from 'react';
import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import JoanieApiProvider from 'contexts/JoanieApiContext';
import { OfferingFactory, OrganizationFactory } from 'utils/test/factories/joanie';
import {
  LocalStorageArchiveFilters,
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

describe.each([
  {
    testLabel: 'for all organization and all trainings',
    organization: undefined,
    offering: undefined,
  },
  {
    testLabel: 'for a training in an organization',
    organization: OrganizationFactory().one(),
    offering: OfferingFactory().one(),
  },
  {
    testLabel: 'for an organization',
    organization: OrganizationFactory().one(),
    offering: undefined,
  },
  {
    testLabel: 'for a training',
    organization: undefined,
    offering: OfferingFactory().one(),
  },
])('useCheckContractArchiveExists $testLabel', ({ organization, offering }) => {
  const Wrapper = ({ children }: PropsWithChildren) => {
    return (
      <IntlProvider locale="en">
        <JoanieApiProvider>{children}</JoanieApiProvider>
      </IntlProvider>
    );
  };
  let localStorageArchiveFilters: LocalStorageArchiveFilters;

  beforeEach(() => {
    localStorageArchiveFilters = {
      organizationId: organization ? organization.id : undefined,
      offeringId: offering ? offering.id : undefined,
    };

    // Joanie providers calls
    fetchMock.get('https://joanie.test/api/v1.0/orders/', []);
    fetchMock.get('https://joanie.test/api/v1.0/credit-cards/', []);
    fetchMock.get('https://joanie.test/api/v1.0/addresses/', []);
  });

  afterEach(() => {
    unstoreContractArchiveId(localStorageArchiveFilters);

    jest.resetAllMocks();
    fetchMock.restore();
    unstoreContractArchiveId();
  });

  it('should do nothing and return default value when no contractArchiveId is stored', () => {
    const { result } = renderHook(useCheckContractArchiveExists, {
      initialProps: localStorageArchiveFilters,
      wrapper: Wrapper,
    });

    expect(result.current.isContractArchiveExists).toBe(false);
    expect(mockCheckArchive).not.toHaveBeenCalled();
  });

  it('should check if archive exist when an id is stored', async () => {
    storeContractArchiveId({
      ...localStorageArchiveFilters,
      contractArchiveId: faker.string.uuid(),
    });
    mockCheckArchive.mockResolvedValue(true);

    const { result } = renderHook(useCheckContractArchiveExists, {
      initialProps: localStorageArchiveFilters,
      wrapper: Wrapper,
    });

    expect(result.current.isContractArchiveExists).toBeNull();
    await waitFor(() => {
      expect(mockCheckArchive).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(result.current.isPolling).toBe(false);
    });
    expect(result.current.isContractArchiveExists).toBe(true);
  });

  it('should do nothing when enable is false', () => {
    storeContractArchiveId({ contractArchiveId: faker.string.uuid() });
    mockCheckArchive.mockResolvedValue(true);

    const { result } = renderHook(
      () => useCheckContractArchiveExists({ ...localStorageArchiveFilters, enable: false }),
      {
        wrapper: Wrapper,
      },
    );

    expect(result.current.isContractArchiveExists).toBe(false);
    expect(mockCheckArchive).not.toHaveBeenCalled();
  });

  it('should trigger polling when checkArchiveExist is call', async () => {
    const { result, rerender } = renderHook(useCheckContractArchiveExists, {
      initialProps: localStorageArchiveFilters,
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
    rerender(localStorageArchiveFilters);
    expect(result.current.isPolling).toBe(true);

    mockCheckArchive.mockResolvedValue(true);
    await waitFor(() => {
      expect(mockCheckArchive).toHaveBeenCalledTimes(2);
    });
    expect(result.current.isPolling).toBe(false);
    expect(result.current.isContractArchiveExists).toBe(true);
  });
});

import fetchMock from 'fetch-mock';
import { faker } from '@faker-js/faker';
import { renderHook, waitFor } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { QueryClientProvider } from '@tanstack/react-query';
import { PropsWithChildren } from 'react';
import { PER_PAGE } from 'settings';
import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import { ContractState } from 'types/Joanie';
import { ContractFactory } from 'utils/test/factories/joanie';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import JoanieSessionProvider from 'contexts/SessionContext/JoanieSessionProvider';
import useHasContractToDownload from '.';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: { backend: 'fonzie', endpoint: 'https://auth.test' },
    joanie_backend: { endpoint: 'https://joanie.test' },
  }).one(),
}));

describe('hooks/useHasContractToDownload', () => {
  const Wrapper = ({ children }: PropsWithChildren) => {
    return (
      <IntlProvider locale="en">
        <QueryClientProvider client={createTestQueryClient({ user: true })}>
          <JoanieSessionProvider>{children}</JoanieSessionProvider>
        </QueryClientProvider>
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
    fetchMock.restore();
  });

  it('should return null when joanie request is pending', async () => {
    const organizationId = faker.string.uuid();
    const contractListUrl = `https://joanie.test/api/v1.0/organizations/${organizationId}/contracts/?signature_state=${ContractState.SIGNED}&page=1&page_size=${PER_PAGE.teacherContractList}`;
    fetchMock.get(contractListUrl, {
      count: 1,
      next: null,
      previous: null,
      results: [ContractFactory().one()],
    });

    const { result } = renderHook(() => useHasContractToDownload(organizationId), {
      wrapper: Wrapper,
    });

    expect(result.current).toBeNull();
  });

  it('should return true when joanie return some signed contracts', async () => {
    const organizationId = faker.string.uuid();
    const contractListUrl = `https://joanie.test/api/v1.0/organizations/${organizationId}/contracts/?signature_state=${ContractState.SIGNED}&page=1&page_size=${PER_PAGE.teacherContractList}`;
    fetchMock.get(contractListUrl, {
      count: 1,
      next: null,
      previous: null,
      results: [ContractFactory().one()],
    });

    const { result } = renderHook(() => useHasContractToDownload(organizationId), {
      wrapper: Wrapper,
    });

    await waitFor(() => {
      expect(fetchMock.calls().map((call) => call[0])).toContain(contractListUrl);
      expect(result.current).toBe(true);
    });
  });

  it("should return false when joanie doesn't return any signed contracts", async () => {
    const organizationId = faker.string.uuid();
    const contractListUrl = `https://joanie.test/api/v1.0/organizations/${organizationId}/contracts/?signature_state=${ContractState.SIGNED}&page=1&page_size=${PER_PAGE.teacherContractList}`;
    fetchMock.get(contractListUrl, {
      count: 0,
      next: null,
      previous: null,
      results: [],
    });

    const { result } = renderHook(() => useHasContractToDownload(organizationId), {
      wrapper: Wrapper,
    });
    await waitFor(() => {
      expect(fetchMock.calls().map((call) => call[0])).toContain(contractListUrl);
      expect(result.current).toBe(false);
    });
  });
});

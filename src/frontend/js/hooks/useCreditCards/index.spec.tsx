import { renderHook } from '@testing-library/react-hooks';
import { hydrate, QueryClientProvider } from 'react-query';
import { IntlProvider } from 'react-intl';
import fetchMock from 'fetch-mock';
import { FC } from 'react';
import * as mockFactories from 'utils/test/factories';
import { useCreditCards } from 'hooks/useCreditCards/index';
import { SessionProvider } from 'data/SessionProvider';
import createQueryClient from 'utils/react-query/createQueryClient';
import { Deferred } from 'utils/test/deferred';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockFactories
    .ContextFactory({
      authentication: { backend: 'fonzie', endpoint: 'https://demo.endpoint' },
      joanie_backend: { endpoint: 'https://joanie.endpoint' },
    })
    .generate(),
}));

describe('useCreditCards', () => {
  const createQueryClientWithUser = (isAuthenticated: Boolean) => {
    const user = isAuthenticated ? mockFactories.UserFactory.generate() : null;
    const { clientState } = mockFactories.PersistedClientFactory({
      queries: [mockFactories.QueryStateFactory('user', { data: user })],
    });
    const client = createQueryClient();
    hydrate(client, clientState);

    return client;
  };

  beforeEach(() => {
    fetchMock.get('https://joanie.endpoint/api/orders/', []);
    fetchMock.get('https://joanie.endpoint/api/addresses/', []);
  });

  afterEach(() => {
    jest.clearAllMocks();
    fetchMock.restore();
    sessionStorage.clear();
  });

  const Wrapper: FC = ({ children }) => {
    return (
      <QueryClientProvider client={createQueryClientWithUser(true)}>
        <IntlProvider locale="en">
          <SessionProvider>{children}</SessionProvider>
        </IntlProvider>
      </QueryClientProvider>
    );
  };

  it('retrieves all the credit cards', async () => {
    const creditCards = mockFactories.CreditCardFactory.generate(5);
    const responseDeferred = new Deferred();
    fetchMock.get('https://joanie.endpoint/api/credit-cards/', responseDeferred.promise);
    const { result, waitForNextUpdate } = renderHook(() => useCreditCards(), {
      wrapper: Wrapper,
    });

    await waitForNextUpdate();

    expect(result.current.states.fetching).toBe(true);
    expect(result.current.states.creating).toBe(false);
    expect(result.current.states.deleting).toBe(false);
    expect(result.current.states.updating).toBe(false);
    expect(result.current.states.isLoading).toBe(true);
    expect(result.current.states.error).toBe(undefined);
    expect(result.current.items).toEqual([]);

    responseDeferred.resolve(creditCards);
    await waitForNextUpdate();

    expect(result.current.states.fetching).toBe(false);
    expect(result.current.states.creating).toBe(false);
    expect(result.current.states.deleting).toBe(false);
    expect(result.current.states.updating).toBe(false);
    expect(result.current.states.isLoading).toBe(false);
    expect(result.current.states.error).toBe(undefined);
    expect(JSON.stringify(result.current.items)).toBe(JSON.stringify(creditCards));
  });

  it('retrieves a specific credit card', async () => {
    const creditCards = mockFactories.CreditCardFactory.generate(5);
    const creditCard = creditCards[3];
    const responseDeferred = new Deferred();
    fetchMock.get('https://joanie.endpoint/api/credit-cards/', responseDeferred.promise);
    const { result, waitForNextUpdate } = renderHook(() => useCreditCards(creditCard.id), {
      wrapper: Wrapper,
    });

    expect(result.current.states.fetching).toBe(true);
    expect(result.current.states.creating).toBe(false);
    expect(result.current.states.deleting).toBe(false);
    expect(result.current.states.updating).toBe(false);
    expect(result.current.states.isLoading).toBe(true);
    expect(result.current.states.error).toBe(undefined);
    expect(result.current.items).toEqual([]);

    responseDeferred.resolve(creditCards);
    await waitForNextUpdate();

    expect(result.current.states.fetching).toBe(false);
    expect(result.current.states.creating).toBe(false);
    expect(result.current.states.deleting).toBe(false);
    expect(result.current.states.updating).toBe(false);
    expect(result.current.states.isLoading).toBe(false);
    expect(result.current.states.error).toBe(undefined);
    expect(JSON.stringify(result.current.items)).toBe(JSON.stringify([creditCard]));
  });
});

import faker from 'faker';
import { createSessionStoragePersistor } from 'utils/react-query/createSessionStoragePersistor';
import { persistQueryClient } from 'react-query/persistQueryClient-experimental';
import { QueryClient } from 'react-query';
import {
  ContextFactory as mockContextFactory,
  PersistedClientFactory,
  QueryStateFactory,
} from 'utils/test/factories';
import { REACT_QUERY_SETTINGS } from 'settings';
import { act } from 'react-dom/test-utils';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockContextFactory().generate(),
}));

describe('createSessionStoragePersistor', () => {
  const createQueryClient = () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          cacheTime: 5 * 60 * 1000, // 5 minutes
          staleTime: 2 * 60 * 1000, // 2 minutes
        },
      },
    });
    persistQueryClient({
      persistor: createSessionStoragePersistor(),
      queryClient,
      maxAge: 2 * 60 * 1000,
    });
    return queryClient;
  };
  let queryClient: QueryClient;

  beforeEach(() => {
    jest.useFakeTimers('modern');
  });

  afterEach(() => {
    queryClient.clear();
    jest.clearAllTimers();
  });

  it('persists state into sessionStorage', async () => {
    const username = faker.internet.userName();

    await act(async () => {
      queryClient = createQueryClient();
    });

    queryClient.setQueryData('user', { username });

    let cacheString = sessionStorage.getItem(REACT_QUERY_SETTINGS.cacheStorage.key);
    expect(cacheString).not.toBeNull();
    let client = JSON.parse(cacheString!);

    // As persistClient is throttled, it has not been executed yet,
    // so sessionStorage is not up to date
    expect(client.clientState.queries).toHaveLength(0);

    // advance timer by the throttle delay to execute persistClient
    jest.advanceTimersByTime(REACT_QUERY_SETTINGS.cacheStorage.throttleTime);

    // Now all data within sessionStorage are fresh
    cacheString = sessionStorage.getItem(REACT_QUERY_SETTINGS.cacheStorage.key);
    client = JSON.parse(cacheString!);

    expect(client.clientState.queries).toHaveLength(1);
    expect(client.clientState.queries[0].queryKey).toEqual('user');
    expect(client.clientState.queries[0].state.data).toStrictEqual({ username });
  });

  it('hydrates state', async () => {
    const username = faker.internet.userName();

    sessionStorage.setItem(
      REACT_QUERY_SETTINGS.cacheStorage.key,
      JSON.stringify(
        PersistedClientFactory({
          queries: [QueryStateFactory('user', { data: { username } })],
        }),
      ),
    );

    await act(async () => {
      queryClient = createQueryClient();
    });

    const data = queryClient.getQueryData('user');

    expect(data).toStrictEqual({ username });
  });

  it('is cleaned when cache has expired', async () => {
    const username = faker.internet.userName();

    await act(async () => {
      queryClient = createQueryClient();
    });

    queryClient.setQueryData('user', { username });
    jest.advanceTimersByTime(REACT_QUERY_SETTINGS.cacheStorage.throttleTime);

    let cacheString = sessionStorage.getItem(REACT_QUERY_SETTINGS.cacheStorage.key);
    expect(cacheString).not.toBeNull();

    const client = JSON.parse(cacheString!);
    expect(client.clientState.queries).toHaveLength(1);
    expect(client.clientState.queries[0].queryKey).toEqual('user');
    expect(client.clientState.queries[0].state.data).toStrictEqual({ username });

    // When sessionStorage has expired, persistClient cleans it through the
    // removeClient method
    jest.advanceTimersByTime(2 * 60 * 1000);

    await act(async () => {
      queryClient = createQueryClient();
    });

    cacheString = sessionStorage.getItem(REACT_QUERY_SETTINGS.cacheStorage.key);
    expect(cacheString).toBeNull();
  });
});

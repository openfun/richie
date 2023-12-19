import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { IntlProvider } from 'react-intl';
import fetchMock from 'fetch-mock';
import { PropsWithChildren } from 'react';
import { PaginatedResourceQuery } from 'types/Joanie';
import { History, HistoryContext } from 'hooks/useHistory';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import { SessionProvider } from 'contexts/SessionContext';
import { Deferred } from 'utils/test/deferred';

import { noop } from 'utils';
import { mockPaginatedResponse } from 'utils/test/mockPaginatedResponse';
import { PER_PAGE } from 'settings';
import { HttpError, HttpStatusCode } from 'utils/errors/HttpError';
import { FetchEntityData } from './utils/fetchEntities';
import { QueryConfig, FetchDataFunction } from './utils/fetchEntity';
import useUnionResource from '.';

jest.mock('settings', () => ({
  __esModule: true,
  ...jest.requireActual('settings'),
  PER_PAGE: { useUnionResources: 3 },
}));

interface TestDataA {
  name: 'TestDataA';
  id: string;
  created_on: string;
}
interface TestDataAFilters extends PaginatedResourceQuery {
  isFiltered?: boolean;
}
interface TestDataB {
  name: 'TestDataB';
  id: string;
  created_on: string;
}

const renderUseUnionResource = <
  DataA extends FetchEntityData,
  DataB extends FetchEntityData,
  FiltersA extends PaginatedResourceQuery,
  FiltersB extends PaginatedResourceQuery,
>(
  queryAConfig: QueryConfig<DataA, FiltersA>,
  queryBConfig: QueryConfig<DataB, FiltersB>,
) => {
  const Wrapper = ({ client, children }: PropsWithChildren<{ client?: QueryClient }>) => {
    const historyPushState = jest.fn();
    const historyReplaceState = jest.fn();
    const makeHistoryOf: (params: any) => History = () => [
      {
        state: { name: '', data: {} },
        title: '',
        url: `/`,
      },
      historyPushState,
      historyReplaceState,
    ];

    return (
      <QueryClientProvider client={client ?? createTestQueryClient({ user: true })}>
        <IntlProvider locale="en">
          <HistoryContext.Provider value={makeHistoryOf({})}>
            <SessionProvider>{children}</SessionProvider>
          </HistoryContext.Provider>
        </IntlProvider>
      </QueryClientProvider>
    );
  };

  return renderHook(
    () =>
      useUnionResource<DataA, DataB, FiltersA, FiltersB>({
        queryAConfig,
        queryBConfig,
      }),
    { wrapper: Wrapper },
  );
};

describe('useUnionResource', () => {
  const perPage = PER_PAGE.useUnionResources;
  let dataAList: TestDataA[];
  let dataBList: TestDataB[];
  let queryAConfig: QueryConfig<TestDataA, TestDataAFilters>;
  let queryBConfig: QueryConfig<TestDataB, PaginatedResourceQuery>;

  beforeEach(() => {
    dataAList = [
      { name: 'TestDataA', id: '1', created_on: '2022-01-01' },
      { name: 'TestDataA', id: '2', created_on: '2022-02-01' },
      { name: 'TestDataA', id: '3', created_on: '2022-07-01' },

      { name: 'TestDataA', id: '4', created_on: '2022-03-01' },
      { name: 'TestDataA', id: '5', created_on: '2022-06-01' },
      { name: 'TestDataA', id: '6', created_on: '2022-04-01' },

      { name: 'TestDataA', id: '7', created_on: '2022-05-01' },
    ];

    dataBList = [
      { name: 'TestDataB', id: '8', created_on: '2022-08-01' },
      { name: 'TestDataB', id: '9', created_on: '2022-09-01' },
      { name: 'TestDataB', id: '10', created_on: '2022-12-01' },

      { name: 'TestDataB', id: '11', created_on: '2022-10-01' },
      { name: 'TestDataB', id: '12', created_on: '2022-11-01' },
      { name: 'TestDataB', id: '13', created_on: '2022-12-02' },

      { name: 'TestDataB', id: '14', created_on: '2022-12-03' },
    ];
    const dummyFetchWrapper = async (url: string) => {
      const res = await fetch(url);
      return res.json();
    };
    const fetchDataA = ({ page }: { page: number }) =>
      dummyFetchWrapper(`http://data.a/?page=${page}`);
    const fetchDataB = ({ page }: { page: number }) =>
      dummyFetchWrapper(`http://data.b/?page=${page}`);

    queryAConfig = {
      queryKey: ['resourceA'],
      fn: fetchDataA as unknown as FetchDataFunction<TestDataA, TestDataAFilters>,
      filters: {},
    };
    queryBConfig = {
      queryKey: ['resourceB'],
      fn: fetchDataB as unknown as FetchDataFunction<TestDataB, PaginatedResourceQuery>,
      filters: {},
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
    fetchMock.restore();
  });

  it('should handle loading state', async () => {
    const dataADeferred = new Deferred();
    const dataBDeferred = new Deferred();
    const pendingDataAPromise = () => dataADeferred.promise;
    const pendingDataBPromise = () => dataBDeferred.promise;
    queryAConfig.fn = pendingDataAPromise as FetchDataFunction<TestDataA, TestDataAFilters>;
    queryBConfig.fn = pendingDataBPromise as FetchDataFunction<TestDataB, PaginatedResourceQuery>;
    const { result } = renderUseUnionResource<
      TestDataA,
      TestDataB,
      TestDataAFilters,
      PaginatedResourceQuery
    >(queryAConfig, queryBConfig);
    expect(result.current.isLoading).toBe(true);
    expect(result.current.hasMore).toBe(false);

    await act(() => {
      dataADeferred.resolve(mockPaginatedResponse([], 0, false));
      dataBDeferred.resolve(mockPaginatedResponse([], 0, false));
    });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toEqual([]);
  });

  it('should render less than 1 page of dataA', async () => {
    fetchMock.get('http://data.a/?page=1', mockPaginatedResponse([dataAList[0]], 1, false));
    fetchMock.get('http://data.b/?page=1', mockPaginatedResponse([], 0, false));
    const { result } = renderUseUnionResource<
      TestDataA,
      TestDataB,
      TestDataAFilters,
      PaginatedResourceQuery
    >(queryAConfig, queryBConfig);

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.hasMore).toBe(false);
    expect(result.current.data.length).toBe(1);
    expect(result.current.data[0]).toEqual(dataAList[0]);
  });

  it('should render less than 1 page of dataB', async () => {
    fetchMock.get('http://data.a/?page=1', mockPaginatedResponse([], 0, false));
    fetchMock.get('http://data.b/?page=1', mockPaginatedResponse([dataBList[0]], 1, false));
    const { result } = renderUseUnionResource<
      TestDataA,
      TestDataB,
      TestDataAFilters,
      PaginatedResourceQuery
    >(queryAConfig, queryBConfig);

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.hasMore).toBe(false);
    expect(result.current.data.length).toBe(1);
    expect(result.current.data[0]).toEqual(dataBList[0]);
  });

  it('should renders less than 1 page of both dataA and dataB', async () => {
    fetchMock.get('http://data.a/?page=1', mockPaginatedResponse([dataAList[0]], 1, false));
    fetchMock.get('http://data.b/?page=1', mockPaginatedResponse([dataBList[0]], 1, false));
    const { result } = renderUseUnionResource<
      TestDataA,
      TestDataB,
      TestDataAFilters,
      PaginatedResourceQuery
    >(queryAConfig, queryBConfig);

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.hasMore).toBe(false);
    expect(result.current.data.length).toBe(2);
    expect(result.current.data[0]).toEqual(dataBList[0]);
    expect(result.current.data[1]).toEqual(dataAList[0]);
  });

  it('should multiple pages of dataA and dataB', async () => {
    fetchMock.get(
      'http://data.a/?page=1',
      mockPaginatedResponse(dataAList.slice(0, perPage), dataAList.length),
    );
    fetchMock.get(
      'http://data.a/?page=2',
      mockPaginatedResponse(dataAList.slice(perPage, perPage * 2), dataAList.length),
    );
    fetchMock.get(
      'http://data.a/?page=3',
      mockPaginatedResponse(dataAList.slice(perPage * 2, perPage * 3), dataAList.length, false),
    );

    fetchMock.get(
      'http://data.b/?page=1',
      mockPaginatedResponse(dataBList.slice(0, perPage), dataAList.length),
    );
    fetchMock.get(
      'http://data.b/?page=2',
      mockPaginatedResponse(dataBList.slice(perPage, perPage * 2), dataAList.length),
    );
    fetchMock.get(
      'http://data.b/?page=3',
      mockPaginatedResponse(dataBList.slice(perPage * 2, perPage * 3), dataAList.length, false),
    );

    const { result } = renderUseUnionResource<
      TestDataA,
      TestDataB,
      TestDataAFilters,
      PaginatedResourceQuery
    >(queryAConfig, queryBConfig);

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.hasMore).toBe(true);
    expect(result.current.data.length).toBe(3);

    await act(() => {
      result.current.next();
    });
    expect(result.current.data.length).toBe(6);
    expect(result.current.hasMore).toBe(true);

    await act(() => {
      result.current.next();
    });
    expect(result.current.data.length).toBe(9);
    expect(result.current.hasMore).toBe(true);

    await act(() => {
      result.current.next();
    });
    expect(result.current.data.length).toBe(12);
    expect(result.current.hasMore).toBe(true);

    await act(() => {
      result.current.next();
    });
    expect(result.current.data.length).toBe(14);
    expect(result.current.hasMore).toBe(false);

    const entitiesCreatedOn = result.current.data.map((entity) => entity.created_on);
    expect(entitiesCreatedOn).toStrictEqual([
      '2022-12-03',
      '2022-12-02',
      '2022-12-01',
      '2022-11-01',
      '2022-10-01',
      '2022-09-01',
      '2022-08-01',
      '2022-07-01',
      '2022-06-01',
      '2022-05-01',
      '2022-04-01',
      '2022-03-01',
      '2022-02-01',
      '2022-01-01',
    ]);
  });

  it('should return an error', async () => {
    jest.spyOn(console, 'error').mockImplementation(noop);
    fetchMock.get('http://data.b/?page=1', mockPaginatedResponse([], 0, false));
    const dataADeferred = new Deferred();
    const pendingDataAPromise = () => dataADeferred.promise;
    queryAConfig.fn = pendingDataAPromise as FetchDataFunction<TestDataA, TestDataAFilters>;
    const { result } = renderUseUnionResource<
      TestDataA,
      TestDataB,
      TestDataAFilters,
      PaginatedResourceQuery
    >(queryAConfig, queryBConfig);
    expect(result.current.isLoading).toBe(true);

    await act(() => {
      dataADeferred.reject(
        new HttpError(HttpStatusCode.INTERNAL_SERVER_ERROR, 'Internal Server Error'),
      );
    });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe('An error occurred while fetching data. Please retry later.');
  });
});

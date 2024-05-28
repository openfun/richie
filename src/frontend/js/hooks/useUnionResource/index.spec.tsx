import { renderHook, act, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import queryString from 'query-string';
import { PaginatedResourceQuery, PaginatedResponse } from 'types/Joanie';
import { Deferred } from 'utils/test/deferred';
import { noop } from 'utils';
import { mockPaginatedResponse } from 'utils/test/mockPaginatedResponse';
import { PER_PAGE } from 'settings';
import { HttpError, HttpStatusCode } from 'utils/errors/HttpError';
import AppWrapper from 'utils/test/wrappers/AppWrapper';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
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
    const dummyFetchWrapper = async (url: string, queryParams: { [key: string]: any }) => {
      const res = await fetch(`${url}?${queryString.stringify(queryParams)}`);
      return res.json();
    };
    const fetchDataA = ({ page, isFiltered }: { page: number; isFiltered?: boolean }) =>
      dummyFetchWrapper('http://data.a/', { page, isFiltered });
    const fetchDataB = ({ page }: { page: number }) =>
      dummyFetchWrapper('http://data.b/', { page });

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

  it('should handle loading state', async () => {
    const dataADeferred = new Deferred();
    const dataBDeferred = new Deferred();
    const pendingDataAPromise = () => dataADeferred.promise;
    const pendingDataBPromise = () => dataBDeferred.promise;
    queryAConfig.fn = pendingDataAPromise as FetchDataFunction<TestDataA, TestDataAFilters>;
    queryBConfig.fn = pendingDataBPromise as FetchDataFunction<TestDataB, PaginatedResourceQuery>;

    const { result } = renderHook(
      () =>
        useUnionResource<TestDataA, TestDataB, TestDataAFilters, PaginatedResourceQuery>({
          queryAConfig,
          queryBConfig,
        }),
      { wrapper: AppWrapper },
    );

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

    const { result } = renderHook(
      () =>
        useUnionResource<TestDataA, TestDataB, TestDataAFilters, PaginatedResourceQuery>({
          queryAConfig,
          queryBConfig,
        }),
      { wrapper: AppWrapper },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.hasMore).toBe(false);
    expect(result.current.data.length).toBe(1);
    expect(result.current.data[0]).toEqual(dataAList[0]);
  });

  it('should render less than 1 page of dataB', async () => {
    fetchMock.get('http://data.a/?page=1', mockPaginatedResponse([], 0, false));
    fetchMock.get('http://data.b/?page=1', mockPaginatedResponse([dataBList[0]], 1, false));

    const { result } = renderHook(
      () =>
        useUnionResource<TestDataA, TestDataB, TestDataAFilters, PaginatedResourceQuery>({
          queryAConfig,
          queryBConfig,
        }),
      { wrapper: AppWrapper },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.hasMore).toBe(false);
    expect(result.current.data.length).toBe(1);
    expect(result.current.data[0]).toEqual(dataBList[0]);
  });

  it('should renders less than 1 page of both dataA and dataB', async () => {
    fetchMock.get('http://data.a/?page=1', mockPaginatedResponse([dataAList[0]], 1, false));
    fetchMock.get('http://data.b/?page=1', mockPaginatedResponse([dataBList[0]], 1, false));

    const { result } = renderHook(
      () =>
        useUnionResource<TestDataA, TestDataB, TestDataAFilters, PaginatedResourceQuery>({
          queryAConfig,
          queryBConfig,
        }),
      { wrapper: AppWrapper },
    );

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

    const { result } = renderHook(
      () =>
        useUnionResource<TestDataA, TestDataB, TestDataAFilters, PaginatedResourceQuery>({
          queryAConfig,
          queryBConfig,
        }),
      { wrapper: AppWrapper },
    );

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

    const { result } = renderHook(
      () =>
        useUnionResource<TestDataA, TestDataB, TestDataAFilters, PaginatedResourceQuery>({
          queryAConfig,
          queryBConfig,
        }),
      { wrapper: AppWrapper },
    );

    expect(result.current.isLoading).toBe(true);

    await act(() => {
      dataADeferred.reject(
        new HttpError(HttpStatusCode.INTERNAL_SERVER_ERROR, 'Internal Server Error'),
      );
    });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe('An error occurred while fetching data. Please retry later.');
  });

  it('should refetch data when filters change', async () => {
    fetchMock.get(
      'http://data.a/?page=1',
      mockPaginatedResponse([dataAList[0], dataAList[1], dataAList[2]], 7, true),
    );
    fetchMock.get(
      'http://data.a/?page=2',
      mockPaginatedResponse([dataAList[3], dataAList[4], dataAList[5]], 7, true),
    );
    fetchMock.get('http://data.a/?page=3', mockPaginatedResponse([dataAList[6]], 7, false));
    fetchMock.get('http://data.b/?page=1', mockPaginatedResponse([], 0, false));

    const { result, rerender } = renderHook(
      (queries: {
        queryA?: QueryConfig<TestDataA, TestDataAFilters>;
        queryB?: QueryConfig<TestDataB, PaginatedResourceQuery>;
      }) =>
        useUnionResource<TestDataA, TestDataB, TestDataAFilters, PaginatedResourceQuery>({
          queryAConfig: queries?.queryA || queryAConfig,
          queryBConfig: queries?.queryB || queryBConfig,
        }),
      { wrapper: AppWrapper },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    // two page of 3 item have been fetch but only 3 item are displayed.
    act(() => {
      // display one more page for a total of 6 item displayed
      result.current.next();
    });
    act(() => {
      // display one more page for a total of 7 item displayed
      result.current.next();
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.hasMore).toBe(false);

    let calledUrls = fetchMock.calls().map((call) => call[0]);
    let expectedQueries = 4;
    expect(calledUrls).toHaveLength(expectedQueries);
    expect(calledUrls).toContain('http://data.a/?page=1');
    expect(calledUrls).toContain('http://data.a/?page=2');
    expect(calledUrls).toContain('http://data.a/?page=3');
    expect(calledUrls).toContain('http://data.b/?page=1');

    queryAConfig.filters = { isFiltered: true };
    fetchMock.get(
      'http://data.a/?isFiltered=true&page=1',
      mockPaginatedResponse([dataAList[0]], 1, false),
    );
    rerender({ queryA: queryAConfig, queryB: queryBConfig });
    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    calledUrls = fetchMock.calls().map((call) => call[0]);
    expectedQueries += 1; // fetch dataA first page
    expectedQueries += 1; // fetch dataB first page
    expect(calledUrls).toHaveLength(expectedQueries);
    expect(calledUrls).toContain('http://data.a/?isFiltered=true&page=1');
    expect(result.current.hasMore).toBe(false);
  });

  it.each([
    {
      testLabel: 'with some results',
      testDataAList: [{ name: 'TestDataA', id: '1', created_on: '2022-01-01' }],
    },
    {
      testLabel: 'without results',
      testDataAList: [],
    },
  ])('should refetch data when a query $testLabel is invalidate', async ({ testDataAList }) => {
    fetchMock.get(
      'http://data.a/?page=1',
      mockPaginatedResponse(testDataAList, testDataAList.length, false),
    );
    fetchMock.get('http://data.b/?page=1', mockPaginatedResponse([], 0, false));

    const queryClient = createTestQueryClient({ user: true });
    const { result, rerender } = renderHook(
      (queries: {
        queryA?: QueryConfig<TestDataA, TestDataAFilters>;
        queryB?: QueryConfig<TestDataB, PaginatedResourceQuery>;
      }) =>
        useUnionResource<TestDataA, TestDataB, TestDataAFilters, PaginatedResourceQuery>({
          queryAConfig: queries?.queryA || queryAConfig,
          queryBConfig: queries?.queryB || queryBConfig,
        }),
      {
        wrapper: ({ children }) => (
          <AppWrapper queryOptions={{ client: queryClient }}>{children}</AppWrapper>
        ),
      },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    let calledUrls = fetchMock.calls().map((call) => call[0]);
    expect(calledUrls).toHaveLength(2);
    expect(calledUrls).toContain('http://data.a/?page=1');
    expect(calledUrls).toContain('http://data.b/?page=1');

    queryClient.invalidateQueries({ queryKey: queryAConfig.queryKey });
    rerender({ queryA: { ...queryAConfig }, queryB: queryBConfig });
    await waitFor(() => {
      calledUrls = fetchMock.calls().map((call) => call[0]);
      expect(calledUrls).toHaveLength(3);
    });
    expect(calledUrls.filter((url) => url === 'http://data.a/?page=1')).toHaveLength(2);
    expect(calledUrls.filter((url) => url === 'http://data.b/?page=1')).toHaveLength(1);
  });

  it('should adapt eof to the total number of result when it change', async () => {
    fetchMock.get(
      'http://data.a/?page=1',
      mockPaginatedResponse([dataAList[0], dataAList[1], dataAList[2]], 6, true),
    );
    fetchMock.get(
      'http://data.a/?page=2',
      mockPaginatedResponse([dataAList[3], dataAList[4], dataAList[5]], 6, false),
    );
    fetchMock.get('http://data.b/?page=1', mockPaginatedResponse([], 0, false));

    const queryClient = createTestQueryClient({ user: true });
    const { result } = renderHook(
      (queries: {
        queryA?: QueryConfig<TestDataA, TestDataAFilters>;
        queryB?: QueryConfig<TestDataB, PaginatedResourceQuery>;
      }) =>
        useUnionResource<TestDataA, TestDataB, TestDataAFilters, PaginatedResourceQuery>({
          queryAConfig: queries?.queryA || queryAConfig,
          queryBConfig: queries?.queryB || queryBConfig,
        }),
      {
        wrapper: ({ children }) => (
          <AppWrapper queryOptions={{ client: queryClient }}>{children}</AppWrapper>
        ),
      },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    // two page of 3 item have been fetch but only 3 item are displayed.
    act(() => {
      // display one more page for a total of 6 item displayed
      result.current.next();
    });
    expect(result.current.hasMore).toBe(false);

    let calledUrls = fetchMock.calls().map((call) => call[0]);
    expect(calledUrls).toHaveLength(3);
    expect(calledUrls).toContain('http://data.a/?page=1');
    expect(calledUrls).toContain('http://data.a/?page=2');
    expect(calledUrls).toContain('http://data.b/?page=1');

    // simulate backend adding items, totalResults move from 6 to 7
    // it means that we should request one more page.
    fetchMock.restore();
    fetchMock.get(
      'http://data.a/?page=1',
      mockPaginatedResponse([dataAList[0], dataAList[1], dataAList[2]], 7, true),
    );
    fetchMock.get(
      'http://data.a/?page=2',
      mockPaginatedResponse([dataAList[3], dataAList[4], dataAList[5]], 7, true),
    );
    fetchMock.get('http://data.a/?page=3', mockPaginatedResponse([dataAList[6]], 7, false));
    fetchMock.get('http://data.b/?page=1', mockPaginatedResponse([], 0, false));

    // simulate cache expire
    queryClient.invalidateQueries({ queryKey: ['resourceA'] });
    queryClient.invalidateQueries({ queryKey: ['resourceB'] });

    await waitFor(() => {
      expect(
        queryClient.getQueryState<PaginatedResponse<TestDataA>>(['resourceA']),
      ).toBeUndefined();
      expect(
        queryClient.getQueryState<PaginatedResponse<TestDataB>>(['resourceB']),
      ).toBeUndefined();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toHaveLength(3);
    });

    // two page of 3 item have been fetch but only 3 item are displayed.
    act(() => {
      // display one more page for a total of 6 item displayed
      result.current.next();
    });
    act(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toHaveLength(6);
    });

    act(() => {
      // display one more page for a total of 7 item displayed
      result.current.next();
    });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toHaveLength(7);
    });

    await waitFor(() => {
      expect(result.current.hasMore).toBe(false);
    });

    calledUrls = fetchMock.calls().map((call) => call[0]);
    expect(calledUrls).toHaveLength(4);

    expect(calledUrls).toContain('http://data.a/?page=1');
    expect(calledUrls).toContain('http://data.a/?page=2');
    expect(calledUrls).toContain('http://data.a/?page=3');
    expect(calledUrls).toContain('http://data.b/?page=1');
  });
});

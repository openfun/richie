import { act, renderHook } from '@testing-library/react';
import { PropsWithChildren } from 'react';

import { HistoryProvider } from 'hooks/useHistory';
import * as mockWindow from 'utils/indirection/window';
import { CourseSearchParamsAction, useCourseSearchParams } from '.';

jest.mock('settings', () => ({
  API_LIST_DEFAULT_PARAMS: { limit: '13', offset: '0' },
}));

jest.mock('utils/indirection/window', () => ({
  history: { pushState: jest.fn(), replaceState: jest.fn() },
  location: {},
}));

describe('hooks/useCourseSearchParams', () => {
  const wrapper = ({ children }: PropsWithChildren<any>) => (
    <HistoryProvider>{children}</HistoryProvider>
  );

  beforeEach(() => {
    // Remove any keys added to the mockWindow location object, reset pathname to /search
    Object.keys(mockWindow.location).forEach((key) => delete (mockWindow.location as any)[key]);
    mockWindow.location.pathname = '/search';
    jest.resetAllMocks();
  });

  it('initializes with the URL query string', async () => {
    mockWindow.location.search =
      '?organizations=L-00010003&organizations=L-00010009&query=some%20query&limit=8&offset=3';
    const { result } = renderHook(useCourseSearchParams, { wrapper });
    const { courseSearchParams } = result.current;

    expect(courseSearchParams).toEqual({
      limit: '8',
      offset: '3',
      organizations: ['L-00010003', 'L-00010009'],
      query: 'some query',
    });
    // There is nothing to update as we're just using the existing query parameters
    expect(mockWindow.history.pushState).not.toHaveBeenCalled();
  });

  it('initializes with defaults if there is no query string param', () => {
    mockWindow.location.search = '';
    const { result } = renderHook(useCourseSearchParams, { wrapper });
    const { courseSearchParams } = result.current;

    expect(courseSearchParams).toEqual({ limit: '13', offset: '0' });
    // We need an update so the URL reflects the actual query params
    expect(mockWindow.history.replaceState).toHaveBeenCalledTimes(1);
    expect(mockWindow.history.replaceState).toHaveBeenCalledWith(
      {
        name: 'courseSearch',
        data: {
          lastDispatchActions: null,
          params: { limit: '13', offset: '0' },
        },
      },
      '',
      '/search?limit=13&offset=0',
    );
  });

  describe('PAGE_CHANGE', () => {
    it('updates the offset on the courseSearchParams & updates history', () => {
      mockWindow.location.search = '?languages=fr&limit=13&offset=26';
      const { result } = renderHook(useCourseSearchParams, { wrapper });

      {
        const { courseSearchParams, dispatchCourseSearchParamsUpdate } = result.current;
        expect(courseSearchParams).toEqual({
          languages: 'fr',
          limit: '13',
          offset: '26',
        });
        act(() =>
          dispatchCourseSearchParamsUpdate({
            offset: '39',
            type: CourseSearchParamsAction.pageChange,
          }),
        );
      }
      {
        const { courseSearchParams } = result.current;
        expect(courseSearchParams).toEqual({
          languages: 'fr',
          limit: '13',
          offset: '39',
        });
        expect(mockWindow.history.pushState).toHaveBeenCalledTimes(1);
        expect(mockWindow.history.pushState).toHaveBeenCalledWith(
          {
            name: 'courseSearch',
            data: {
              lastDispatchActions: [
                {
                  offset: '39',
                  type: CourseSearchParamsAction.pageChange,
                },
              ],
              params: { languages: 'fr', limit: '13', offset: '39' },
            },
          },
          '',
          '/search?languages=fr&limit=13&offset=39',
        );
      }
    });
  });

  describe('QUERY_UPDATE', () => {
    it('sets the query on courseSearchParams, resets pagination & updates history', () => {
      mockWindow.location.search = '?languages=en&limit=17&offset=5';
      const { result } = renderHook(useCourseSearchParams, { wrapper });
      {
        const { courseSearchParams, dispatchCourseSearchParamsUpdate } = result.current;
        expect(courseSearchParams).toEqual({
          languages: 'en',
          limit: '17',
          offset: '5',
        });
        act(() =>
          dispatchCourseSearchParamsUpdate({
            query: 'some text query',
            type: CourseSearchParamsAction.queryUpdate,
          }),
        );
      }
      {
        const { courseSearchParams } = result.current;
        expect(courseSearchParams).toEqual({
          languages: 'en',
          limit: '17',
          offset: '0',
          query: 'some text query',
        });
        expect(mockWindow.history.pushState).toHaveBeenCalledTimes(1);
        expect(mockWindow.history.pushState).toHaveBeenCalledWith(
          {
            name: 'courseSearch',
            data: {
              lastDispatchActions: [
                {
                  query: 'some text query',
                  type: CourseSearchParamsAction.queryUpdate,
                },
              ],
              params: {
                languages: 'en',
                limit: '17',
                offset: '0',
                query: 'some text query',
              },
            },
          },
          '',
          '/search?languages=en&limit=17&offset=0&query=some%20text%20query',
        );
      }
    });

    it('replaces the query on courseSearchParams & updates history', () => {
      mockWindow.location.search = '?languages=fr&limit=999&offset=0&query=some%20previous%20query';
      const { result } = renderHook(useCourseSearchParams, { wrapper });

      {
        const { courseSearchParams, dispatchCourseSearchParamsUpdate } = result.current;
        expect(courseSearchParams).toEqual({
          languages: 'fr',
          limit: '999',
          offset: '0',
          query: 'some previous query',
        });
        act(() =>
          dispatchCourseSearchParamsUpdate({
            query: 'some new query',
            type: CourseSearchParamsAction.queryUpdate,
          }),
        );
      }
      {
        const { courseSearchParams } = result.current;
        expect(courseSearchParams).toEqual({
          languages: 'fr',
          limit: '999',
          offset: '0',
          query: 'some new query',
        });
        expect(mockWindow.history.pushState).toHaveBeenCalledTimes(1);
        expect(mockWindow.history.pushState).toHaveBeenCalledWith(
          {
            name: 'courseSearch',
            data: {
              lastDispatchActions: [
                {
                  query: 'some new query',
                  type: CourseSearchParamsAction.queryUpdate,
                },
              ],
              params: {
                languages: 'fr',
                limit: '999',
                offset: '0',
                query: 'some new query',
              },
            },
          },
          '',
          '/search?languages=fr&limit=999&offset=0&query=some%20new%20query',
        );
      }
    });

    it('clears the query on courseSearchParams & updates query history', () => {
      mockWindow.location.search = '?languages=es&limit=999&offset=0&query=some%20existing%20query';
      const { result } = renderHook(useCourseSearchParams, { wrapper });

      {
        const { courseSearchParams, dispatchCourseSearchParamsUpdate } = result.current;
        expect(courseSearchParams).toEqual({
          languages: 'es',
          limit: '999',
          offset: '0',
          query: 'some existing query',
        });
        act(() =>
          dispatchCourseSearchParamsUpdate({
            query: '',
            type: CourseSearchParamsAction.queryUpdate,
          }),
        );
      }
      {
        const { courseSearchParams } = result.current;
        expect(courseSearchParams).toEqual({
          languages: 'es',
          limit: '999',
          offset: '0',
          query: undefined,
        });
        expect(mockWindow.history.pushState).toHaveBeenCalledTimes(1);
        expect(mockWindow.history.pushState).toHaveBeenCalledWith(
          {
            name: 'courseSearch',
            data: {
              lastDispatchActions: [
                {
                  query: '',
                  type: CourseSearchParamsAction.queryUpdate,
                },
              ],
              params: {
                languages: 'es',
                limit: '999',
                offset: '0',
                query: undefined,
              },
            },
          },
          '',
          '/search?languages=es&limit=999&offset=0',
        );
      }
    });
  });

  describe('FILTER_ADD [non drilldown]', () => {
    it('adds the value to the existing list for this filter, resets pagination & updates history', () => {
      mockWindow.location.search =
        '?organizations=L-00010003&organizations=L-00010009&offset=999&limit=10';
      const { result } = renderHook(useCourseSearchParams, { wrapper });

      {
        const { courseSearchParams, dispatchCourseSearchParamsUpdate } = result.current;
        expect(courseSearchParams).toEqual({
          limit: '10',
          offset: '999',
          organizations: ['L-00010003', 'L-00010009'],
        });

        act(() =>
          dispatchCourseSearchParamsUpdate({
            filter: {
              base_path: null,
              human_name: 'Organizations',
              is_autocompletable: false,
              is_drilldown: false,
              is_searchable: false,
              name: 'organizations',
              position: 0,
            },
            payload: 'L-00010017',
            type: CourseSearchParamsAction.filterAdd,
          }),
        );
      }
      {
        const { courseSearchParams } = result.current;
        expect(courseSearchParams).toEqual({
          limit: '10',
          offset: '0',
          organizations: ['L-00010003', 'L-00010009', 'L-00010017'],
        });
        expect(mockWindow.history.pushState).toHaveBeenCalledTimes(1);
        expect(mockWindow.history.pushState).toHaveBeenCalledWith(
          {
            name: 'courseSearch',
            data: {
              lastDispatchActions: [
                {
                  filter: {
                    base_path: null,
                    human_name: 'Organizations',
                    is_autocompletable: false,
                    is_drilldown: false,
                    is_searchable: false,
                    name: 'organizations',
                    position: 0,
                  },
                  payload: 'L-00010017',
                  type: CourseSearchParamsAction.filterAdd,
                },
              ],
              params: {
                limit: '10',
                offset: '0',
                organizations: ['L-00010003', 'L-00010009', 'L-00010017'],
              },
            },
          },
          '',
          '/search?limit=10&offset=0&organizations=L-00010003&organizations=L-00010009&organizations=L-00010017',
        );
      }
    });

    it('adds to the existing list for non-MPTT-formatted filter value keys and resets pagination', () => {
      mockWindow.location.search = '?languages=en&languages=fr&offset=999&limit=10';
      const { result } = renderHook(useCourseSearchParams, { wrapper });

      {
        const { courseSearchParams, dispatchCourseSearchParamsUpdate } = result.current;
        expect(courseSearchParams).toEqual({
          languages: ['en', 'fr'],
          limit: '10',
          offset: '999',
        });

        act(() =>
          dispatchCourseSearchParamsUpdate({
            filter: {
              base_path: null,
              human_name: 'Languages',
              is_autocompletable: false,
              is_drilldown: false,
              is_searchable: false,
              name: 'languages',
              position: 0,
            },
            payload: 'it',
            type: CourseSearchParamsAction.filterAdd,
          }),
        );
      }
      {
        const { courseSearchParams } = result.current;
        expect(courseSearchParams).toEqual({
          languages: ['en', 'fr', 'it'],
          limit: '10',
          offset: '0',
        });
        expect(mockWindow.history.pushState).toHaveBeenCalledTimes(1);
        expect(mockWindow.history.pushState).toHaveBeenCalledWith(
          {
            name: 'courseSearch',
            data: {
              lastDispatchActions: [
                {
                  filter: {
                    base_path: null,
                    human_name: 'Languages',
                    is_autocompletable: false,
                    is_drilldown: false,
                    is_searchable: false,
                    name: 'languages',
                    position: 0,
                  },
                  payload: 'it',
                  type: CourseSearchParamsAction.filterAdd,
                },
              ],
              params: {
                languages: ['en', 'fr', 'it'],
                limit: '10',
                offset: '0',
              },
            },
          },
          '',
          '/search?languages=en&languages=fr&languages=it&limit=10&offset=0',
        );
      }
    });

    it('creates a list with the existing single value and the new value, resets pagination & updates history', () => {
      mockWindow.location.search = '?organizations=L-00010003&offset=999&limit=10';
      const { result } = renderHook(useCourseSearchParams, { wrapper });

      {
        const { courseSearchParams, dispatchCourseSearchParamsUpdate } = result.current;
        expect(courseSearchParams).toEqual({
          limit: '10',
          offset: '999',
          organizations: 'L-00010003',
        });

        act(() =>
          dispatchCourseSearchParamsUpdate({
            filter: {
              base_path: null,
              human_name: 'Organizations',
              is_autocompletable: false,
              is_drilldown: false,
              is_searchable: false,
              name: 'organizations',
              position: 0,
            },
            payload: 'L-00010017',
            type: CourseSearchParamsAction.filterAdd,
          }),
        );
      }
      {
        const { courseSearchParams } = result.current;
        expect(courseSearchParams).toEqual({
          limit: '10',
          offset: '0',
          organizations: ['L-00010003', 'L-00010017'],
        });
        expect(mockWindow.history.pushState).toHaveBeenCalledTimes(1);
        expect(mockWindow.history.pushState).toHaveBeenCalledWith(
          {
            name: 'courseSearch',
            data: {
              lastDispatchActions: [
                {
                  filter: {
                    base_path: null,
                    human_name: 'Organizations',
                    is_autocompletable: false,
                    is_drilldown: false,
                    is_searchable: false,
                    name: 'organizations',
                    position: 0,
                  },
                  payload: 'L-00010017',
                  type: CourseSearchParamsAction.filterAdd,
                },
              ],
              params: {
                limit: '10',
                offset: '0',
                organizations: ['L-00010003', 'L-00010017'],
              },
            },
          },
          '',
          '/search?limit=10&offset=0&organizations=L-00010003&organizations=L-00010017',
        );
      }
    });

    it('creates the new list for non-MPTT-formatted filter value keys and resets pagination', () => {
      mockWindow.location.search = '?languages=de&offset=999&limit=10';
      const { result } = renderHook(useCourseSearchParams, { wrapper });

      {
        const { courseSearchParams, dispatchCourseSearchParamsUpdate } = result.current;
        expect(courseSearchParams).toEqual({
          languages: 'de',
          limit: '10',
          offset: '999',
        });

        act(() =>
          dispatchCourseSearchParamsUpdate({
            filter: {
              base_path: null,
              human_name: 'Languages',
              is_autocompletable: false,
              is_drilldown: false,
              is_searchable: false,
              name: 'languages',
              position: 0,
            },
            payload: 'zh',
            type: CourseSearchParamsAction.filterAdd,
          }),
        );
      }
      {
        const { courseSearchParams } = result.current;
        expect(courseSearchParams).toEqual({
          languages: ['de', 'zh'],
          limit: '10',
          offset: '0',
        });
        expect(mockWindow.history.pushState).toHaveBeenCalledTimes(1);
        expect(mockWindow.history.pushState).toHaveBeenCalledWith(
          {
            name: 'courseSearch',
            data: {
              lastDispatchActions: [
                {
                  filter: {
                    base_path: null,
                    human_name: 'Languages',
                    is_autocompletable: false,
                    is_drilldown: false,
                    is_searchable: false,
                    name: 'languages',
                    position: 0,
                  },
                  payload: 'zh',
                  type: CourseSearchParamsAction.filterAdd,
                },
              ],
              params: {
                languages: ['de', 'zh'],
                limit: '10',
                offset: '0',
              },
            },
          },
          '',
          '/search?languages=de&languages=zh&limit=10&offset=0',
        );
      }
    });

    it('creates a new list with the value & updates history', () => {
      mockWindow.location.search = '?limit=999&offset=0&query=some%20query';
      const { result } = renderHook(useCourseSearchParams, { wrapper });

      {
        const { courseSearchParams, dispatchCourseSearchParamsUpdate } = result.current;
        expect(courseSearchParams).toEqual({
          limit: '999',
          offset: '0',
          query: 'some query',
        });

        act(() =>
          dispatchCourseSearchParamsUpdate({
            filter: {
              base_path: null,
              human_name: 'Organizations',
              is_autocompletable: false,
              is_drilldown: false,
              is_searchable: false,
              name: 'organizations',
              position: 0,
            },
            payload: 'L-00010014',
            type: CourseSearchParamsAction.filterAdd,
          }),
        );
      }
      {
        const { courseSearchParams } = result.current;
        expect(courseSearchParams).toEqual({
          limit: '999',
          offset: '0',
          organizations: ['L-00010014'],
          query: 'some query',
        });
        expect(mockWindow.history.pushState).toHaveBeenCalledTimes(1);
        expect(mockWindow.history.pushState).toHaveBeenCalledWith(
          {
            name: 'courseSearch',
            data: {
              lastDispatchActions: [
                {
                  filter: {
                    base_path: null,
                    human_name: 'Organizations',
                    is_autocompletable: false,
                    is_drilldown: false,
                    is_searchable: false,
                    name: 'organizations',
                    position: 0,
                  },
                  payload: 'L-00010014',
                  type: CourseSearchParamsAction.filterAdd,
                },
              ],
              params: {
                limit: '999',
                offset: '0',
                organizations: ['L-00010014'],
                query: 'some query',
              },
            },
          },
          '',
          '/search?limit=999&offset=0&organizations=L-00010014&query=some%20query',
        );
      }
    });

    it('does nothing if the value is already in the list for this filter', () => {
      mockWindow.location.search =
        '?limit=999&offset=0&query=some%20query&organizations=L-00010009';
      const { result } = renderHook(useCourseSearchParams, { wrapper });

      {
        const { courseSearchParams, dispatchCourseSearchParamsUpdate } = result.current;
        expect(courseSearchParams).toEqual({
          limit: '999',
          offset: '0',
          organizations: 'L-00010009',
          query: 'some query',
        });

        act(() =>
          dispatchCourseSearchParamsUpdate({
            filter: {
              base_path: null,
              human_name: 'Organizations',
              is_autocompletable: false,
              is_drilldown: false,
              is_searchable: false,
              name: 'organizations',
              position: 0,
            },
            payload: 'L-00010009',
            type: CourseSearchParamsAction.filterAdd,
          }),
        );
      }
      {
        const { courseSearchParams } = result.current;
        expect(courseSearchParams).toEqual({
          limit: '999',
          offset: '0',
          organizations: ['L-00010009'],
          query: 'some query',
        });
        expect(mockWindow.history.pushState).not.toHaveBeenCalled();
      }
    });

    it('removes any active children of it when it adds a new parent filter', () => {
      mockWindow.location.search =
        '?limit=999&offset=0&query=a%20query' +
        // children of the incoming filter
        '&subjects=L-0002000300050001&subjects=L-0002000300050004' +
        // some other category from the same meta-category (subject)
        '&subjects=P-000200030012' +
        // some unrelated category from another meta-category
        '&levels=L-000200020005';
      const { result } = renderHook(useCourseSearchParams, { wrapper });

      {
        const { courseSearchParams, dispatchCourseSearchParamsUpdate } = result.current;
        expect(courseSearchParams).toEqual({
          levels: 'L-000200020005',
          limit: '999',
          offset: '0',
          query: 'a query',
          subjects: ['L-0002000300050001', 'L-0002000300050004', 'P-000200030012'],
        });

        act(() =>
          dispatchCourseSearchParamsUpdate({
            filter: {
              base_path: null,
              human_name: 'Subjects',
              is_autocompletable: false,
              is_drilldown: false,
              is_searchable: false,
              name: 'subjects',
              position: 0,
            },
            payload: 'L-000200030005',
            type: CourseSearchParamsAction.filterAdd,
          }),
        );
      }
      {
        const { courseSearchParams } = result.current;
        expect(courseSearchParams).toEqual({
          levels: 'L-000200020005',
          limit: '999',
          offset: '0',
          query: 'a query',
          subjects: ['P-000200030012', 'L-000200030005'],
        });
        expect(mockWindow.history.pushState).toHaveBeenCalledTimes(1);
        expect(mockWindow.history.pushState).toHaveBeenCalledWith(
          {
            name: 'courseSearch',
            data: {
              lastDispatchActions: [
                {
                  filter: {
                    base_path: null,
                    human_name: 'Subjects',
                    is_autocompletable: false,
                    is_drilldown: false,
                    is_searchable: false,
                    name: 'subjects',
                    position: 0,
                  },
                  payload: 'L-000200030005',
                  type: CourseSearchParamsAction.filterAdd,
                },
              ],
              params: {
                levels: 'L-000200020005',
                limit: '999',
                offset: '0',
                query: 'a query',
                subjects: ['P-000200030012', 'L-000200030005'],
              },
            },
          },
          '',
          '/search?levels=L-000200020005&limit=999&offset=0&query=a%20query&subjects=P-000200030012&subjects=L-000200030005',
        );
      }
    });

    it('replaces the existing single value when it adds its parent', () => {
      mockWindow.location.search =
        '?limit=999&offset=0&query=some%20query' +
        // child of the incoming filter
        '&subjects=L-0002000300050001' +
        // some unrelated category from another meta-category
        '&levels=L-000200020005';
      const { result } = renderHook(useCourseSearchParams, { wrapper });

      {
        const { courseSearchParams, dispatchCourseSearchParamsUpdate } = result.current;
        expect(courseSearchParams).toEqual({
          levels: 'L-000200020005',
          limit: '999',
          offset: '0',
          query: 'some query',
          subjects: 'L-0002000300050001',
        });

        act(() =>
          dispatchCourseSearchParamsUpdate({
            filter: {
              base_path: null,
              human_name: 'Subjects',
              is_autocompletable: false,
              is_drilldown: false,
              is_searchable: false,
              name: 'subjects',
              position: 0,
            },
            payload: 'L-000200030005',
            type: CourseSearchParamsAction.filterAdd,
          }),
        );
      }
      {
        const { courseSearchParams } = result.current;
        expect(courseSearchParams).toEqual({
          levels: 'L-000200020005',
          limit: '999',
          offset: '0',
          query: 'some query',
          subjects: ['L-000200030005'],
        });
        expect(mockWindow.history.pushState).toHaveBeenCalledTimes(1);
        expect(mockWindow.history.pushState).toHaveBeenCalledWith(
          {
            name: 'courseSearch',
            data: {
              lastDispatchActions: [
                {
                  filter: {
                    base_path: null,
                    human_name: 'Subjects',
                    is_autocompletable: false,
                    is_drilldown: false,
                    is_searchable: false,
                    name: 'subjects',
                    position: 0,
                  },
                  payload: 'L-000200030005',
                  type: CourseSearchParamsAction.filterAdd,
                },
              ],
              params: {
                levels: 'L-000200020005',
                limit: '999',
                offset: '0',
                query: 'some query',
                subjects: ['L-000200030005'],
              },
            },
          },
          '',
          '/search?levels=L-000200020005&limit=999&offset=0&query=some%20query&subjects=L-000200030005',
        );
      }
    });

    it('removes the active parent when it adds one of its children', () => {
      mockWindow.location.search =
        '?limit=999&offset=0&query=some%20query' +
        // parent of the incoming filter
        '&subjects=P-000200030005' +
        // some other category from the same meta-category (subject)
        '&subjects=P-000200030012' +
        // some unrelated category from another meta-category
        '&levels=L-000200020005';
      const { result } = renderHook(useCourseSearchParams, { wrapper });

      {
        const { courseSearchParams, dispatchCourseSearchParamsUpdate } = result.current;
        expect(courseSearchParams).toEqual({
          levels: 'L-000200020005',
          limit: '999',
          offset: '0',
          query: 'some query',
          subjects: ['P-000200030005', 'P-000200030012'],
        });

        act(() =>
          dispatchCourseSearchParamsUpdate({
            filter: {
              base_path: null,
              human_name: 'Subjects',
              is_autocompletable: false,
              is_drilldown: false,
              is_searchable: false,
              name: 'subjects',
              position: 0,
            },
            payload: 'L-0002000300050013',
            type: CourseSearchParamsAction.filterAdd,
          }),
        );
      }
      {
        const { courseSearchParams } = result.current;
        expect(courseSearchParams).toEqual({
          levels: 'L-000200020005',
          limit: '999',
          offset: '0',
          query: 'some query',
          subjects: ['P-000200030012', 'L-0002000300050013'],
        });
        expect(mockWindow.history.pushState).toHaveBeenCalledTimes(1);
        expect(mockWindow.history.pushState).toHaveBeenCalledWith(
          {
            name: 'courseSearch',
            data: {
              lastDispatchActions: [
                {
                  filter: {
                    base_path: null,
                    human_name: 'Subjects',
                    is_autocompletable: false,
                    is_drilldown: false,
                    is_searchable: false,
                    name: 'subjects',
                    position: 0,
                  },
                  payload: 'L-0002000300050013',
                  type: CourseSearchParamsAction.filterAdd,
                },
              ],
              params: {
                levels: 'L-000200020005',
                limit: '999',
                offset: '0',
                query: 'some query',
                subjects: ['P-000200030012', 'L-0002000300050013'],
              },
            },
          },
          '',
          '/search?levels=L-000200020005&limit=999&offset=0&query=some%20query' +
            '&subjects=P-000200030012&subjects=L-0002000300050013',
        );
      }
    });

    it('replaces the existing single value when it adds its child', () => {
      mockWindow.location.search =
        '?limit=999&offset=0&query=some%20query' +
        // parent of the incoming filter
        '&subjects=P-000200030005' +
        // some unrelated category from another meta-category
        '&levels=L-000200020005';
      const { result } = renderHook(useCourseSearchParams, { wrapper });

      {
        const { courseSearchParams, dispatchCourseSearchParamsUpdate } = result.current;
        expect(courseSearchParams).toEqual({
          levels: 'L-000200020005',
          limit: '999',
          offset: '0',
          query: 'some query',
          subjects: 'P-000200030005',
        });

        act(() =>
          dispatchCourseSearchParamsUpdate({
            filter: {
              base_path: null,
              human_name: 'Subjects',
              is_autocompletable: false,
              is_drilldown: false,
              is_searchable: false,
              name: 'subjects',
              position: 0,
            },
            payload: 'L-0002000300050013',
            type: CourseSearchParamsAction.filterAdd,
          }),
        );
      }
      {
        const { courseSearchParams } = result.current;
        expect(courseSearchParams).toEqual({
          levels: 'L-000200020005',
          limit: '999',
          offset: '0',
          query: 'some query',
          subjects: ['L-0002000300050013'],
        });
        expect(mockWindow.history.pushState).toHaveBeenCalledTimes(1);
        expect(mockWindow.history.pushState).toHaveBeenCalledWith(
          {
            name: 'courseSearch',
            data: {
              lastDispatchActions: [
                {
                  filter: {
                    base_path: null,
                    human_name: 'Subjects',
                    is_autocompletable: false,
                    is_drilldown: false,
                    is_searchable: false,
                    name: 'subjects',
                    position: 0,
                  },
                  payload: 'L-0002000300050013',
                  type: CourseSearchParamsAction.filterAdd,
                },
              ],
              params: {
                levels: 'L-000200020005',
                limit: '999',
                offset: '0',
                query: 'some query',
                subjects: ['L-0002000300050013'],
              },
            },
          },
          '',
          '/search?levels=L-000200020005&limit=999&offset=0&query=some%20query&subjects=L-0002000300050013',
        );
      }
    });
  });

  describe('FILTER_ADD [drilldown]', () => {
    it('sets the value for the filter', () => {
      mockWindow.location.search = '?limit=999&offset=0';
      const { result } = renderHook(useCourseSearchParams, { wrapper });

      {
        // Set a value where there was no value
        const { courseSearchParams, dispatchCourseSearchParamsUpdate } = result.current;
        expect(courseSearchParams).toEqual({
          limit: '999',
          offset: '0',
        });

        act(() =>
          dispatchCourseSearchParamsUpdate({
            filter: {
              base_path: null,
              human_name: 'Level',
              is_autocompletable: false,
              is_drilldown: true,
              is_searchable: false,
              name: 'level',
              position: 0,
            },
            payload: 'L-000200010003',
            type: CourseSearchParamsAction.filterAdd,
          }),
        );
      }
      {
        const { courseSearchParams } = result.current;
        expect(courseSearchParams).toEqual({
          level: 'L-000200010003',
          limit: '999',
          offset: '0',
        });
        expect(mockWindow.history.pushState).toHaveBeenCalledTimes(1);
        expect(mockWindow.history.pushState).toHaveBeenCalledWith(
          {
            name: 'courseSearch',
            data: {
              lastDispatchActions: [
                {
                  filter: {
                    base_path: null,
                    human_name: 'Level',
                    is_autocompletable: false,
                    is_drilldown: true,
                    is_searchable: false,
                    name: 'level',
                    position: 0,
                  },
                  payload: 'L-000200010003',
                  type: CourseSearchParamsAction.filterAdd,
                },
              ],
              params: {
                level: 'L-000200010003',
                limit: '999',
                offset: '0',
              },
            },
          },
          '',
          '/search?level=L-000200010003&limit=999&offset=0',
        );
      }
      {
        // Replace an existing value
        jest.resetAllMocks();
        const { dispatchCourseSearchParamsUpdate } = result.current;
        act(() =>
          dispatchCourseSearchParamsUpdate({
            filter: {
              base_path: null,
              human_name: 'Level',
              is_autocompletable: false,
              is_drilldown: true,
              is_searchable: false,
              name: 'level',
              position: 0,
            },
            payload: 'L-000200010002',
            type: CourseSearchParamsAction.filterAdd,
          }),
        );
      }
      {
        const { courseSearchParams } = result.current;
        expect(courseSearchParams).toEqual({
          level: 'L-000200010002',
          limit: '999',
          offset: '0',
        });
        expect(mockWindow.history.pushState).toHaveBeenCalledTimes(1);
        expect(mockWindow.history.pushState).toHaveBeenCalledWith(
          {
            name: 'courseSearch',
            data: {
              lastDispatchActions: [
                {
                  filter: {
                    base_path: null,
                    human_name: 'Level',
                    is_autocompletable: false,
                    is_drilldown: true,
                    is_searchable: false,
                    name: 'level',
                    position: 0,
                  },
                  payload: 'L-000200010002',
                  type: CourseSearchParamsAction.filterAdd,
                },
              ],
              params: {
                level: 'L-000200010002',
                limit: '999',
                offset: '0',
              },
            },
          },
          '',
          '/search?level=L-000200010002&limit=999&offset=0',
        );
      }
    });

    it('does nothing if the value was already on the filter', () => {
      mockWindow.location.search = '?level=L-000200010001&limit=999&offset=0';
      const { result } = renderHook(useCourseSearchParams, { wrapper });

      {
        const { courseSearchParams, dispatchCourseSearchParamsUpdate } = result.current;
        expect(courseSearchParams).toEqual({
          level: 'L-000200010001',
          limit: '999',
          offset: '0',
        });

        act(() =>
          dispatchCourseSearchParamsUpdate({
            filter: {
              base_path: null,
              human_name: 'Level',
              is_autocompletable: false,
              is_drilldown: true,
              is_searchable: false,
              name: 'level',
              position: 0,
            },
            payload: 'L-000200010001',
            type: CourseSearchParamsAction.filterAdd,
          }),
        );
      }
      {
        const { courseSearchParams } = result.current;
        expect(courseSearchParams).toEqual({
          level: 'L-000200010001',
          limit: '999',
          offset: '0',
        });
        expect(mockWindow.history.pushState).not.toHaveBeenCalled();
      }
    });
  });

  describe('FILTER_REMOVE [non drilldown]', () => {
    it('removes the value from the existing list for this filter & updates history', () => {
      mockWindow.location.search =
        '?limit=999&offset=0&query=some%20query&organizations=L-00010009&organizations=L00010011';
      const { result } = renderHook(useCourseSearchParams, { wrapper });

      {
        // Remove from a list of more than one value
        const { courseSearchParams, dispatchCourseSearchParamsUpdate } = result.current;
        expect(courseSearchParams).toEqual({
          limit: '999',
          offset: '0',
          organizations: ['L-00010009', 'L00010011'],
          query: 'some query',
        });

        act(() =>
          dispatchCourseSearchParamsUpdate({
            filter: {
              base_path: null,
              human_name: 'Organizations',
              is_autocompletable: false,
              is_drilldown: false,
              is_searchable: false,
              name: 'organizations',
              position: 0,
            },
            payload: 'L-00010009',
            type: CourseSearchParamsAction.filterRemove,
          }),
        );
      }
      {
        const { courseSearchParams } = result.current;
        expect(courseSearchParams).toEqual({
          limit: '999',
          offset: '0',
          organizations: ['L00010011'],
          query: 'some query',
        });
        expect(mockWindow.history.pushState).toHaveBeenCalledTimes(1);
        expect(mockWindow.history.pushState).toHaveBeenCalledWith(
          {
            name: 'courseSearch',
            data: {
              lastDispatchActions: [
                {
                  filter: {
                    base_path: null,
                    human_name: 'Organizations',
                    is_autocompletable: false,
                    is_drilldown: false,
                    is_searchable: false,
                    name: 'organizations',
                    position: 0,
                  },
                  payload: 'L-00010009',
                  type: CourseSearchParamsAction.filterRemove,
                },
              ],
              params: {
                limit: '999',
                offset: '0',
                organizations: ['L00010011'],
                query: 'some query',
              },
            },
          },
          '',
          '/search?limit=999&offset=0&organizations=L00010011&query=some%20query',
        );
      }
      {
        // Remove from a list of just one value
        jest.resetAllMocks();
        const { dispatchCourseSearchParamsUpdate } = result.current;

        act(() =>
          dispatchCourseSearchParamsUpdate({
            filter: {
              base_path: null,
              human_name: 'Organizations',
              is_autocompletable: false,
              is_drilldown: false,
              is_searchable: false,
              name: 'organizations',
              position: 0,
            },
            payload: 'L00010011',
            type: CourseSearchParamsAction.filterRemove,
          }),
        );
      }
      {
        const { courseSearchParams } = result.current;
        expect(courseSearchParams).toEqual({
          limit: '999',
          offset: '0',
          query: 'some query',
        });
        expect(mockWindow.history.pushState).toHaveBeenCalledTimes(1);
        expect(mockWindow.history.pushState).toHaveBeenCalledWith(
          {
            name: 'courseSearch',
            data: {
              lastDispatchActions: [
                {
                  filter: {
                    base_path: null,
                    human_name: 'Organizations',
                    is_autocompletable: false,
                    is_drilldown: false,
                    is_searchable: false,
                    name: 'organizations',
                    position: 0,
                  },
                  payload: 'L00010011',
                  type: CourseSearchParamsAction.filterRemove,
                },
              ],
              params: {
                limit: '999',
                offset: '0',
                query: 'some query',
              },
            },
          },
          '',
          '/search?limit=999&offset=0&query=some%20query',
        );
      }
    });

    it('removes the existing single value if it matches the payload', () => {
      // This is a special case when there is a single value not wrapper in an array after it was
      // just parsed and not interacted with yet.
      mockWindow.location.search =
        '?limit=999&offset=0&query=some%20query&organizations=L-00010013';
      const { result } = renderHook(useCourseSearchParams, { wrapper });

      {
        const { courseSearchParams, dispatchCourseSearchParamsUpdate } = result.current;
        expect(courseSearchParams).toEqual({
          limit: '999',
          offset: '0',
          organizations: 'L-00010013',
          query: 'some query',
        });

        act(() =>
          dispatchCourseSearchParamsUpdate({
            filter: {
              base_path: null,
              human_name: 'Organizations',
              is_autocompletable: false,
              is_drilldown: false,
              is_searchable: false,
              name: 'organizations',
              position: 0,
            },
            payload: 'L-00010013',
            type: CourseSearchParamsAction.filterRemove,
          }),
        );
      }
      {
        const { courseSearchParams } = result.current;
        expect(courseSearchParams).toEqual({
          limit: '999',
          offset: '0',
          query: 'some query',
        });
        expect(mockWindow.history.pushState).toHaveBeenCalledTimes(1);
        expect(mockWindow.history.pushState).toHaveBeenCalledWith(
          {
            name: 'courseSearch',
            data: {
              lastDispatchActions: [
                {
                  filter: {
                    base_path: null,
                    human_name: 'Organizations',
                    is_autocompletable: false,
                    is_drilldown: false,
                    is_searchable: false,
                    name: 'organizations',
                    position: 0,
                  },
                  payload: 'L-00010013',
                  type: CourseSearchParamsAction.filterRemove,
                },
              ],
              params: {
                limit: '999',
                offset: '0',
                query: 'some query',
              },
            },
          },
          '',
          '/search?limit=999&offset=0&query=some%20query',
        );
      }
    });

    it('does nothing if there was no value for this filter', () => {
      mockWindow.location.search = '?limit=999&offset=0&query=some%20query';
      const { result } = renderHook(useCourseSearchParams, { wrapper });

      {
        const { courseSearchParams, dispatchCourseSearchParamsUpdate } = result.current;
        expect(courseSearchParams).toEqual({
          limit: '999',
          offset: '0',
          query: 'some query',
        });

        act(() =>
          dispatchCourseSearchParamsUpdate({
            filter: {
              base_path: null,
              human_name: 'Subjects',
              is_autocompletable: false,
              is_drilldown: false,
              is_searchable: false,
              name: 'subjects',
              position: 0,
            },
            payload: 'L-00010076',
            type: CourseSearchParamsAction.filterRemove,
          }),
        );
      }
      {
        const { courseSearchParams } = result.current;
        expect(courseSearchParams).toEqual({
          limit: '999',
          offset: '0',
          query: 'some query',
        });
        expect(mockWindow.history.pushState).not.toHaveBeenCalled();
      }
    });

    it('does nothing if the value was not in the list for this filter', () => {
      mockWindow.location.search =
        '?limit=999&offset=0&organizations=L-00010003&organizations=L-00010009';
      const { result } = renderHook(useCourseSearchParams, { wrapper });

      {
        const { courseSearchParams, dispatchCourseSearchParamsUpdate } = result.current;
        expect(courseSearchParams).toEqual({
          limit: '999',
          offset: '0',
          organizations: ['L-00010003', 'L-00010009'],
        });

        act(() =>
          dispatchCourseSearchParamsUpdate({
            filter: {
              base_path: null,
              human_name: 'Organizations',
              is_autocompletable: false,
              is_drilldown: false,
              is_searchable: false,
              name: 'organizations',
              position: 0,
            },
            payload: '121',
            type: CourseSearchParamsAction.filterRemove,
          }),
        );
      }
      {
        const { courseSearchParams } = result.current;
        expect(courseSearchParams).toEqual({
          limit: '999',
          offset: '0',
          organizations: ['L-00010003', 'L-00010009'],
        });
        expect(mockWindow.history.pushState).not.toHaveBeenCalled();
      }
    });

    it('does nothing if the existing single value does not match the payload', () => {
      // This is a special case when there is a single value not wrapper in an array after it was
      // just parsed and not interacted with yet.
      mockWindow.location.search = '?limit=999&offset=0&organizations=L-00010011';
      const { result } = renderHook(useCourseSearchParams, { wrapper });

      {
        const { courseSearchParams, dispatchCourseSearchParamsUpdate } = result.current;
        expect(courseSearchParams).toEqual({
          limit: '999',
          offset: '0',
          organizations: 'L-00010011',
        });

        act(() =>
          dispatchCourseSearchParamsUpdate({
            filter: {
              base_path: null,
              human_name: 'Organizations',
              is_autocompletable: false,
              is_drilldown: false,
              is_searchable: false,
              name: 'organizations',
              position: 0,
            },
            payload: '121',
            type: CourseSearchParamsAction.filterRemove,
          }),
        );
      }
      {
        const { courseSearchParams } = result.current;
        expect(courseSearchParams).toEqual({
          limit: '999',
          offset: '0',
          organizations: 'L-00010011',
        });
        expect(mockWindow.history.pushState).not.toHaveBeenCalled();
      }
    });
  });

  describe('FILTER_REMOVE [drilldown]', () => {
    it('removes the value from the filter', () => {
      mockWindow.location.search = '?level=L-000200010001&limit=999&offset=0&query=some%20query';
      const { result } = renderHook(useCourseSearchParams, { wrapper });

      {
        const { courseSearchParams, dispatchCourseSearchParamsUpdate } = result.current;
        expect(courseSearchParams).toEqual({
          level: 'L-000200010001',
          limit: '999',
          offset: '0',
          query: 'some query',
        });

        act(() =>
          dispatchCourseSearchParamsUpdate({
            filter: {
              base_path: null,
              human_name: 'Level',
              is_autocompletable: false,
              is_drilldown: true,
              is_searchable: false,
              name: 'level',
              position: 0,
            },
            payload: 'L-000200010001',
            type: CourseSearchParamsAction.filterRemove,
          }),
        );
      }
      {
        const { courseSearchParams } = result.current;
        expect(courseSearchParams).toEqual({
          limit: '999',
          offset: '0',
          query: 'some query',
        });
        expect(mockWindow.history.pushState).toHaveBeenCalledTimes(1);
        expect(mockWindow.history.pushState).toHaveBeenCalledWith(
          {
            name: 'courseSearch',
            data: {
              lastDispatchActions: [
                {
                  filter: {
                    base_path: null,
                    human_name: 'Level',
                    is_autocompletable: false,
                    is_drilldown: true,
                    is_searchable: false,
                    name: 'level',
                    position: 0,
                  },
                  payload: 'L-000200010001',
                  type: CourseSearchParamsAction.filterRemove,
                },
              ],
              params: {
                limit: '999',
                offset: '0',
                query: 'some query',
              },
            },
          },
          '',
          '/search?limit=999&offset=0&query=some%20query',
        );
      }
    });

    it('does nothing if the value to remove was not the existing value', () => {
      mockWindow.location.search = '?level=L-000200010001&limit=999&offset=0&query=some%20query';
      const { result } = renderHook(useCourseSearchParams, { wrapper });

      {
        const { courseSearchParams, dispatchCourseSearchParamsUpdate } = result.current;
        expect(courseSearchParams).toEqual({
          level: 'L-000200010001',
          limit: '999',
          offset: '0',
          query: 'some query',
        });

        act(() =>
          dispatchCourseSearchParamsUpdate({
            filter: {
              base_path: null,
              human_name: 'Level',
              is_autocompletable: false,
              is_drilldown: true,
              is_searchable: false,
              name: 'level',
              position: 0,
            },
            payload: 'L-000200010003',
            type: CourseSearchParamsAction.filterRemove,
          }),
        );
      }
      {
        const { courseSearchParams } = result.current;
        expect(courseSearchParams).toEqual({
          level: 'L-000200010001',
          limit: '999',
          offset: '0',
          query: 'some query',
        });
        expect(mockWindow.history.pushState).not.toHaveBeenCalled();
      }
    });

    it('does nothing if there was already no value for this filter', () => {
      mockWindow.location.search =
        '?organizations=L-00010009&limit=999&offset=0&query=some%20query';
      const { result } = renderHook(useCourseSearchParams, { wrapper });

      {
        const { courseSearchParams, dispatchCourseSearchParamsUpdate } = result.current;
        expect(courseSearchParams).toEqual({
          limit: '999',
          offset: '0',
          organizations: 'L-00010009',
          query: 'some query',
        });

        act(() =>
          dispatchCourseSearchParamsUpdate({
            filter: {
              base_path: null,
              human_name: 'Level',
              is_autocompletable: false,
              is_drilldown: true,
              is_searchable: false,
              name: 'level',
              position: 0,
            },
            payload: 'L-000200010002',
            type: CourseSearchParamsAction.filterRemove,
          }),
        );
      }
      {
        const { courseSearchParams } = result.current;
        expect(courseSearchParams).toEqual({
          limit: '999',
          offset: '0',
          organizations: 'L-00010009',
          query: 'some query',
        });
        expect(mockWindow.history.pushState).not.toHaveBeenCalled();
      }
    });
  });

  describe('FILTER_RESET', () => {
    it('resets all the query parameters except limit', () => {
      mockWindow.location.search =
        '?organizations=L-00010004&subjects=P-00030004&subjects=P-00030007&limit=27&offset=54&query=some%20query';
      const { result } = renderHook(useCourseSearchParams, { wrapper });

      {
        const { courseSearchParams, dispatchCourseSearchParamsUpdate } = result.current;
        expect(courseSearchParams).toEqual({
          limit: '27',
          offset: '54',
          organizations: 'L-00010004',
          query: 'some query',
          subjects: ['P-00030004', 'P-00030007'],
        });

        act(() =>
          dispatchCourseSearchParamsUpdate({
            type: CourseSearchParamsAction.filterReset,
          }),
        );
      }
      {
        const { courseSearchParams } = result.current;
        expect(courseSearchParams).toEqual({ limit: '27', offset: '0' });
        expect(mockWindow.history.pushState).toHaveBeenCalledWith(
          {
            name: 'courseSearch',
            data: {
              lastDispatchActions: [
                {
                  type: CourseSearchParamsAction.filterReset,
                },
              ],
              params: { limit: '27', offset: '0' },
            },
          },
          '',
          '/search?limit=27&offset=0',
        );
      }
    });
  });

  it('can handle more than one action passed at the same time', () => {
    mockWindow.location.search =
      '?limit=20&offset=0&query=some%20query&organizations=L-00010009&organizations=L00010011';
    const { result } = renderHook(useCourseSearchParams, { wrapper });
    {
      const { courseSearchParams, dispatchCourseSearchParamsUpdate } = result.current;
      expect(courseSearchParams).toEqual({
        limit: '20',
        offset: '0',
        organizations: ['L-00010009', 'L00010011'],
        query: 'some query',
      });
      // Dispatch three actions at once to make sure everything is handled cleanly
      act(() =>
        dispatchCourseSearchParamsUpdate(
          {
            filter: {
              base_path: null,
              human_name: 'Organizations',
              is_autocompletable: false,
              is_drilldown: false,
              is_searchable: false,
              name: 'organizations',
              position: 0,
            },
            payload: 'L-00010009',
            type: CourseSearchParamsAction.filterRemove,
          },
          {
            filter: {
              base_path: null,
              human_name: 'Languages',
              is_autocompletable: false,
              is_drilldown: false,
              is_searchable: false,
              name: 'languages',
              position: 0,
            },
            payload: 'it',
            type: CourseSearchParamsAction.filterAdd,
          },
          {
            query: 'some new query',
            type: CourseSearchParamsAction.queryUpdate,
          },
        ),
      );
    }
    {
      const { courseSearchParams } = result.current;
      expect(courseSearchParams).toEqual({
        languages: ['it'],
        limit: '20',
        offset: '0',
        organizations: ['L00010011'],
        query: 'some new query',
      });
      expect(mockWindow.history.pushState).toHaveBeenCalledTimes(1);
      expect(mockWindow.history.pushState).toHaveBeenCalledWith(
        {
          name: 'courseSearch',
          data: {
            lastDispatchActions: [
              {
                filter: {
                  base_path: null,
                  human_name: 'Organizations',
                  is_autocompletable: false,
                  is_drilldown: false,
                  is_searchable: false,
                  name: 'organizations',
                  position: 0,
                },
                payload: 'L-00010009',
                type: CourseSearchParamsAction.filterRemove,
              },
              {
                filter: {
                  base_path: null,
                  human_name: 'Languages',
                  is_autocompletable: false,
                  is_drilldown: false,
                  is_searchable: false,
                  name: 'languages',
                  position: 0,
                },
                payload: 'it',
                type: CourseSearchParamsAction.filterAdd,
              },
              {
                query: 'some new query',
                type: CourseSearchParamsAction.queryUpdate,
              },
            ],
            params: {
              languages: ['it'],
              limit: '20',
              offset: '0',
              organizations: ['L00010011'],
              query: 'some new query',
            },
          },
        },
        '',
        '/search?languages=it&limit=20&offset=0&organizations=L00010011&query=some%20new%20query',
      );
    }
  });
});

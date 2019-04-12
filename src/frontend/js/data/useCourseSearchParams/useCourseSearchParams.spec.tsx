import React from 'react';
import { act, cleanup, render } from 'react-testing-library';

import * as mockWindow from '../../utils/indirection/window';
import { useCourseSearchParams } from './useCourseSearchParams';

jest.mock('../../utils/indirection/window', () => ({
  history: { pushState: jest.fn() },
  location: {},
}));

describe('data/useCourseSearchParams', () => {
  // Build a helper component with an out-of-scope function to let us reach our Hook from
  // our test cases.
  let getLatestHookValues: any;
  const TestComponent = () => {
    const hookValues = useCourseSearchParams();
    getLatestHookValues = () => hookValues;
    return <div />;
  };

  beforeEach(() => {
    // Remove any keys added to the mockWindow location object
    Object.keys(mockWindow.location).forEach(
      key => delete (mockWindow.location as any)[key],
    );
    jest.resetAllMocks();
  });

  afterEach(cleanup);

  it('initializes with the URL query string', () => {
    mockWindow.location.search =
      '?organizations=L-00010003&organizations=L-00010009&query=some%20query&limit=8&offset=3';
    render(<TestComponent />);
    const [courseSearchParams] = getLatestHookValues();
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
    render(<TestComponent />);
    const [courseSearchParams] = getLatestHookValues();
    expect(courseSearchParams).toEqual({ limit: '999', offset: '0' });
    // We need an update so the URL reflects the actual query params
    expect(mockWindow.history.pushState).toHaveBeenCalledTimes(1);
    expect(mockWindow.history.pushState).toHaveBeenCalledWith(
      null,
      '',
      '?limit=999&offset=0',
    );
  });

  describe('QUERY_UPDATE', () => {
    it('sets the query on courseSearchParams & updates history', () => {
      mockWindow.location.search = '?languages=en&limit=17&offset=5';
      render(<TestComponent />);
      {
        const [courseSearchParams, dispatch] = getLatestHookValues();
        expect(courseSearchParams).toEqual({
          languages: 'en',
          limit: '17',
          offset: '5',
        });
        act(() => dispatch({ query: 'some text query', type: 'QUERY_UPDATE' }));
      }
      {
        const [courseSearchParams] = getLatestHookValues();
        expect(courseSearchParams).toEqual({
          languages: 'en',
          limit: '17',
          offset: '5',
          query: 'some text query',
        });
        expect(mockWindow.history.pushState).toHaveBeenCalledTimes(1);
        expect(mockWindow.history.pushState).toHaveBeenCalledWith(
          null,
          '',
          '?languages=en&limit=17&offset=5&query=some%20text%20query',
        );
      }
    });

    it('replaces the query on courseSearchParams & updates history', () => {
      mockWindow.location.search =
        '?languages=fr&limit=999&offset=0&query=some%20previous%20query';
      render(<TestComponent />);
      {
        const [courseSearchParams, dispatch] = getLatestHookValues();
        expect(courseSearchParams).toEqual({
          languages: 'fr',
          limit: '999',
          offset: '0',
          query: 'some previous query',
        });
        act(() => dispatch({ query: 'some new query', type: 'QUERY_UPDATE' }));
      }
      {
        const [courseSearchParams] = getLatestHookValues();
        expect(courseSearchParams).toEqual({
          languages: 'fr',
          limit: '999',
          offset: '0',
          query: 'some new query',
        });
        expect(mockWindow.history.pushState).toHaveBeenCalledTimes(1);
        expect(mockWindow.history.pushState).toHaveBeenCalledWith(
          null,
          '',
          '?languages=fr&limit=999&offset=0&query=some%20new%20query',
        );
      }
    });

    it('clears the query on courseSearchParams & updates query history', () => {
      mockWindow.location.search =
        '?languages=es&limit=999&offset=0&query=some%20existing%20query';
      render(<TestComponent />);
      {
        const [courseSearchParams, dispatch] = getLatestHookValues();
        expect(courseSearchParams).toEqual({
          languages: 'es',
          limit: '999',
          offset: '0',
          query: 'some existing query',
        });
        act(() => dispatch({ query: undefined, type: 'QUERY_UPDATE' }));
      }
      {
        const [courseSearchParams] = getLatestHookValues();
        expect(courseSearchParams).toEqual({
          languages: 'es',
          limit: '999',
          offset: '0',
          query: undefined,
        });
        expect(mockWindow.history.pushState).toHaveBeenCalledTimes(1);
        expect(mockWindow.history.pushState).toHaveBeenCalledWith(
          null,
          '',
          '?languages=es&limit=999&offset=0',
        );
      }
    });
  });

  describe('FILTER_ADD [non drilldown]', () => {
    it('adds the value to the existing list for this filter & updates history', () => {
      mockWindow.location.search =
        '?organizations=L-00010003&organizations=L-00010009&offset=999&limit=0';
      render(<TestComponent />);
      {
        const [courseSearchParams, dispatch] = getLatestHookValues();
        expect(courseSearchParams).toEqual({
          limit: '0',
          offset: '999',
          organizations: ['L-00010003', 'L-00010009'],
        });

        act(() =>
          dispatch({
            filter: {
              is_drilldown: false,
              name: 'organizations',
            },
            payload: 'L-00010017',
            type: 'FILTER_ADD',
          }),
        );
      }
      {
        const [courseSearchParams] = getLatestHookValues();
        expect(courseSearchParams).toEqual({
          limit: '0',
          offset: '999',
          organizations: ['L-00010003', 'L-00010009', 'L-00010017'],
        });
        expect(mockWindow.history.pushState).toHaveBeenCalledTimes(1);
        expect(mockWindow.history.pushState).toHaveBeenCalledWith(
          null,
          '',
          '?limit=0&offset=999&organizations=L-00010003&organizations=L-00010009&organizations=L-00010017',
        );
      }
    });

    it('creates a list with the existing single value and the new value & updates history', () => {
      mockWindow.location.search =
        '?organizations=L-00010003&offset=999&limit=0';
      render(<TestComponent />);
      {
        const [courseSearchParams, dispatch] = getLatestHookValues();
        expect(courseSearchParams).toEqual({
          limit: '0',
          offset: '999',
          organizations: 'L-00010003',
        });

        act(() =>
          dispatch({
            filter: {
              is_drilldown: false,
              name: 'organizations',
            },
            payload: 'L-00010017',
            type: 'FILTER_ADD',
          }),
        );
      }
      {
        const [courseSearchParams] = getLatestHookValues();
        expect(courseSearchParams).toEqual({
          limit: '0',
          offset: '999',
          organizations: ['L-00010003', 'L-00010017'],
        });
        expect(mockWindow.history.pushState).toHaveBeenCalledTimes(1);
        expect(mockWindow.history.pushState).toHaveBeenCalledWith(
          null,
          '',
          '?limit=0&offset=999&organizations=L-00010003&organizations=L-00010017',
        );
      }
    });

    it('creates a new list with the value & updates history', () => {
      mockWindow.location.search = '?limit=999&offset=0&query=some%20query';
      render(<TestComponent />);
      {
        const [courseSearchParams, dispatch] = getLatestHookValues();
        expect(courseSearchParams).toEqual({
          limit: '999',
          offset: '0',
          query: 'some query',
        });

        act(() =>
          dispatch({
            filter: {
              is_drilldown: false,
              name: 'organizations',
            },
            payload: 'L-00010014',
            type: 'FILTER_ADD',
          }),
        );
      }
      {
        const [courseSearchParams] = getLatestHookValues();
        expect(courseSearchParams).toEqual({
          limit: '999',
          offset: '0',
          organizations: ['L-00010014'],
          query: 'some query',
        });
        expect(mockWindow.history.pushState).toHaveBeenCalledTimes(1);
        expect(mockWindow.history.pushState).toHaveBeenCalledWith(
          null,
          '',
          '?limit=999&offset=0&organizations=L-00010014&query=some%20query',
        );
      }
    });

    it('does nothing if the value is already in the list for this filter', () => {
      mockWindow.location.search =
        '?limit=999&offset=0&query=some%20query&organizations=L-00010009';
      render(<TestComponent />);
      {
        const [courseSearchParams, dispatch] = getLatestHookValues();
        expect(courseSearchParams).toEqual({
          limit: '999',
          offset: '0',
          organizations: 'L-00010009',
          query: 'some query',
        });

        act(() =>
          dispatch({
            filter: {
              is_drilldown: false,
              name: 'organizations',
            },
            payload: 'L-00010009',
            type: 'FILTER_ADD',
          }),
        );
      }
      {
        const [courseSearchParams] = getLatestHookValues();
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
      render(<TestComponent />);
      {
        const [courseSearchParams, dispatch] = getLatestHookValues();
        expect(courseSearchParams).toEqual({
          levels: 'L-000200020005',
          limit: '999',
          offset: '0',
          query: 'a query',
          subjects: [
            'L-0002000300050001',
            'L-0002000300050004',
            'P-000200030012',
          ],
        });

        act(() =>
          dispatch({
            filter: {
              is_drilldown: false,
              name: 'subjects',
            },
            payload: 'L-000200030005',
            type: 'FILTER_ADD',
          }),
        );
      }
      {
        const [courseSearchParams] = getLatestHookValues();
        expect(courseSearchParams).toEqual({
          levels: 'L-000200020005',
          limit: '999',
          offset: '0',
          query: 'a query',
          subjects: ['P-000200030012', 'L-000200030005'],
        });
        expect(mockWindow.history.pushState).toHaveBeenCalledTimes(1);
        expect(mockWindow.history.pushState).toHaveBeenCalledWith(
          null,
          '',
          '?levels=L-000200020005&limit=999&offset=0&query=a%20query&subjects=P-000200030012&subjects=L-000200030005',
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
      render(<TestComponent />);
      {
        const [courseSearchParams, dispatch] = getLatestHookValues();
        expect(courseSearchParams).toEqual({
          levels: 'L-000200020005',
          limit: '999',
          offset: '0',
          query: 'some query',
          subjects: 'L-0002000300050001',
        });

        act(() =>
          dispatch({
            filter: {
              is_drilldown: false,
              name: 'subjects',
            },
            payload: 'L-000200030005',
            type: 'FILTER_ADD',
          }),
        );
      }
      {
        const [courseSearchParams] = getLatestHookValues();
        expect(courseSearchParams).toEqual({
          levels: 'L-000200020005',
          limit: '999',
          offset: '0',
          query: 'some query',
          subjects: ['L-000200030005'],
        });
        expect(mockWindow.history.pushState).toHaveBeenCalledTimes(1);
        expect(mockWindow.history.pushState).toHaveBeenCalledWith(
          null,
          '',
          '?levels=L-000200020005&limit=999&offset=0&query=some%20query&subjects=L-000200030005',
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
      render(<TestComponent />);
      {
        const [courseSearchParams, dispatch] = getLatestHookValues();
        expect(courseSearchParams).toEqual({
          levels: 'L-000200020005',
          limit: '999',
          offset: '0',
          query: 'some query',
          subjects: ['P-000200030005', 'P-000200030012'],
        });

        act(() =>
          dispatch({
            filter: {
              is_drilldown: false,
              name: 'subjects',
            },
            payload: 'L-0002000300050013',
            type: 'FILTER_ADD',
          }),
        );
      }
      {
        const [courseSearchParams] = getLatestHookValues();
        expect(courseSearchParams).toEqual({
          levels: 'L-000200020005',
          limit: '999',
          offset: '0',
          query: 'some query',
          subjects: ['P-000200030012', 'L-0002000300050013'],
        });
        expect(mockWindow.history.pushState).toHaveBeenCalledTimes(1);
        expect(mockWindow.history.pushState).toHaveBeenCalledWith(
          null,
          '',
          '?levels=L-000200020005&limit=999&offset=0&query=some%20query' +
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
      render(<TestComponent />);
      {
        const [courseSearchParams, dispatch] = getLatestHookValues();
        expect(courseSearchParams).toEqual({
          levels: 'L-000200020005',
          limit: '999',
          offset: '0',
          query: 'some query',
          subjects: 'P-000200030005',
        });

        act(() =>
          dispatch({
            filter: {
              is_drilldown: false,
              name: 'subjects',
            },
            payload: 'L-0002000300050013',
            type: 'FILTER_ADD',
          }),
        );
      }
      {
        const [courseSearchParams] = getLatestHookValues();
        expect(courseSearchParams).toEqual({
          levels: 'L-000200020005',
          limit: '999',
          offset: '0',
          query: 'some query',
          subjects: ['L-0002000300050013'],
        });
        expect(mockWindow.history.pushState).toHaveBeenCalledTimes(1);
        expect(mockWindow.history.pushState).toHaveBeenCalledWith(
          null,
          '',
          '?levels=L-000200020005&limit=999&offset=0&query=some%20query&subjects=L-0002000300050013',
        );
      }
    });
  });

  describe('FILTER_ADD [drilldown]', () => {
    it('sets the value for the filter', () => {
      mockWindow.location.search = '?limit=999&offset=0';
      render(<TestComponent />);
      {
        // Set a value where there was no value
        const [courseSearchParams, dispatch] = getLatestHookValues();
        expect(courseSearchParams).toEqual({
          limit: '999',
          offset: '0',
        });

        act(() =>
          dispatch({
            filter: {
              is_drilldown: true,
              name: 'level',
            },
            payload: 'L-000200010003',
            type: 'FILTER_ADD',
          }),
        );
      }
      {
        const [courseSearchParams] = getLatestHookValues();
        expect(courseSearchParams).toEqual({
          level: 'L-000200010003',
          limit: '999',
          offset: '0',
        });
        expect(mockWindow.history.pushState).toHaveBeenCalledTimes(1);
        expect(mockWindow.history.pushState).toHaveBeenCalledWith(
          null,
          '',
          '?level=L-000200010003&limit=999&offset=0',
        );
      }
      {
        // Replace an existing value
        jest.resetAllMocks();
        const [, dispatch] = getLatestHookValues();
        act(() =>
          dispatch({
            filter: {
              is_drilldown: true,
              name: 'level',
            },
            payload: 'L-000200010002',
            type: 'FILTER_ADD',
          }),
        );
      }
      {
        const [courseSearchParams] = getLatestHookValues();
        expect(courseSearchParams).toEqual({
          level: 'L-000200010002',
          limit: '999',
          offset: '0',
        });
        expect(mockWindow.history.pushState).toHaveBeenCalledTimes(1);
        expect(mockWindow.history.pushState).toHaveBeenCalledWith(
          null,
          '',
          '?level=L-000200010002&limit=999&offset=0',
        );
      }
    });

    it('does nothing if the value was already on the filter', () => {
      mockWindow.location.search = '?level=L-000200010001&limit=999&offset=0';
      render(<TestComponent />);
      {
        const [courseSearchParams, dispatch] = getLatestHookValues();
        expect(courseSearchParams).toEqual({
          level: 'L-000200010001',
          limit: '999',
          offset: '0',
        });

        act(() =>
          dispatch({
            filter: {
              is_drilldown: true,
              name: 'level',
            },
            payload: 'L-000200010001',
            type: 'FILTER_ADD',
          }),
        );
      }
      {
        const [courseSearchParams] = getLatestHookValues();
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
      render(<TestComponent />);
      {
        // Remove from a list of more than one value
        const [courseSearchParams, dispatch] = getLatestHookValues();
        expect(courseSearchParams).toEqual({
          limit: '999',
          offset: '0',
          organizations: ['L-00010009', 'L00010011'],
          query: 'some query',
        });

        act(() =>
          dispatch({
            filter: {
              is_drilldown: false,
              name: 'organizations',
            },
            payload: 'L-00010009',
            type: 'FILTER_REMOVE',
          }),
        );
      }
      {
        const [courseSearchParams] = getLatestHookValues();
        expect(courseSearchParams).toEqual({
          limit: '999',
          offset: '0',
          organizations: ['L00010011'],
          query: 'some query',
        });
        expect(mockWindow.history.pushState).toHaveBeenCalledTimes(1);
        expect(mockWindow.history.pushState).toHaveBeenCalledWith(
          null,
          '',
          '?limit=999&offset=0&organizations=L00010011&query=some%20query',
        );
      }
      {
        // Remove from a list of just one value
        jest.resetAllMocks();
        const [, dispatch] = getLatestHookValues();

        act(() =>
          dispatch({
            filter: { is_drilldown: false, name: 'organizations' },
            payload: 'L00010011',
            type: 'FILTER_REMOVE',
          }),
        );
      }
      {
        const [courseSearchParams] = getLatestHookValues();
        expect(courseSearchParams).toEqual({
          limit: '999',
          offset: '0',
          query: 'some query',
        });
        expect(mockWindow.history.pushState).toHaveBeenCalledTimes(1);
        expect(mockWindow.history.pushState).toHaveBeenCalledWith(
          null,
          '',
          '?limit=999&offset=0&query=some%20query',
        );
      }
    });

    it('removes the existing single value if it matches the payload', () => {
      // This is a special case when there is a single value not wrapper in an array after it was
      // just parsed and not interacted with yet.
      mockWindow.location.search =
        '?limit=999&offset=0&query=some%20query&organizations=L-00010013';
      render(<TestComponent />);
      {
        const [courseSearchParams, dispatch] = getLatestHookValues();
        expect(courseSearchParams).toEqual({
          limit: '999',
          offset: '0',
          organizations: 'L-00010013',
          query: 'some query',
        });

        act(() =>
          dispatch({
            filter: {
              is_drilldown: false,
              name: 'organizations',
            },
            payload: 'L-00010013',
            type: 'FILTER_REMOVE',
          }),
        );
      }
      {
        const [courseSearchParams] = getLatestHookValues();
        expect(courseSearchParams).toEqual({
          limit: '999',
          offset: '0',
          query: 'some query',
        });
        expect(mockWindow.history.pushState).toHaveBeenCalledTimes(1);
        expect(mockWindow.history.pushState).toHaveBeenCalledWith(
          null,
          '',
          '?limit=999&offset=0&query=some%20query',
        );
      }
    });

    it('does nothing if there was no value for this filter', () => {
      mockWindow.location.search = '?limit=999&offset=0&query=some%20query';
      render(<TestComponent />);
      {
        const [courseSearchParams, dispatch] = getLatestHookValues();
        expect(courseSearchParams).toEqual({
          limit: '999',
          offset: '0',
          query: 'some query',
        });

        act(() =>
          dispatch({
            filter: {
              is_drilldown: false,
              name: 'subjects',
            },
            payload: 'L-00010076',
            type: 'FILTER_REMOVE',
          }),
        );
      }
      {
        const [courseSearchParams] = getLatestHookValues();
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
      render(<TestComponent />);
      {
        const [courseSearchParams, dispatch] = getLatestHookValues();
        expect(courseSearchParams).toEqual({
          limit: '999',
          offset: '0',
          organizations: ['L-00010003', 'L-00010009'],
        });

        act(() =>
          dispatch({
            filter: {
              is_drilldown: false,
              name: 'organizations',
            },
            payload: '121',
            type: 'FILTER_REMOVE',
          }),
        );
      }
      {
        const [courseSearchParams] = getLatestHookValues();
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
      mockWindow.location.search =
        '?limit=999&offset=0&organizations=L-00010011';
      render(<TestComponent />);
      {
        const [courseSearchParams, dispatch] = getLatestHookValues();
        expect(courseSearchParams).toEqual({
          limit: '999',
          offset: '0',
          organizations: 'L-00010011',
        });

        act(() =>
          dispatch({
            filter: {
              is_drilldown: false,
              name: 'organizations',
            },
            payload: '121',
            type: 'FILTER_REMOVE',
          }),
        );
      }
      {
        const [courseSearchParams] = getLatestHookValues();
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
      mockWindow.location.search =
        '?level=L-000200010001&limit=999&offset=0&query=some%20query';
      render(<TestComponent />);
      {
        const [courseSearchParams, dispatch] = getLatestHookValues();
        expect(courseSearchParams).toEqual({
          level: 'L-000200010001',
          limit: '999',
          offset: '0',
          query: 'some query',
        });

        act(() =>
          dispatch({
            filter: {
              is_drilldown: true,
              name: 'level',
            },
            payload: 'L-000200010001',
            type: 'FILTER_REMOVE',
          }),
        );
      }
      {
        const [courseSearchParams] = getLatestHookValues();
        expect(courseSearchParams).toEqual({
          limit: '999',
          offset: '0',
          query: 'some query',
        });
        expect(mockWindow.history.pushState).toHaveBeenCalledTimes(1);
        expect(mockWindow.history.pushState).toHaveBeenCalledWith(
          null,
          '',
          '?limit=999&offset=0&query=some%20query',
        );
      }
    });

    it('does nothing if the value to remove was not the existing value', () => {
      mockWindow.location.search =
        '?level=L-000200010001&limit=999&offset=0&query=some%20query';
      render(<TestComponent />);
      {
        const [courseSearchParams, dispatch] = getLatestHookValues();
        expect(courseSearchParams).toEqual({
          level: 'L-000200010001',
          limit: '999',
          offset: '0',
          query: 'some query',
        });

        act(() =>
          dispatch({
            filter: {
              is_drilldown: true,
              name: 'level',
            },
            payload: 'L-000200010003',
            type: 'FILTER_REMOVE',
          }),
        );
      }
      {
        const [courseSearchParams] = getLatestHookValues();
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
      render(<TestComponent />);
      {
        const [courseSearchParams, dispatch] = getLatestHookValues();
        expect(courseSearchParams).toEqual({
          limit: '999',
          offset: '0',
          organizations: 'L-00010009',
          query: 'some query',
        });

        act(() =>
          dispatch({
            filter: {
              is_drilldown: true,
              name: 'level',
            },
            payload: 'L-000200010002',
            type: 'FILTER_REMOVE',
          }),
        );
      }
      {
        const [courseSearchParams] = getLatestHookValues();
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
});

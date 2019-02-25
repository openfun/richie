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
      '?organizations=42&organizations=43&query=some%20query&limit=8&offset=3';
    render(<TestComponent />);
    const [courseSearchParams] = getLatestHookValues();
    expect(courseSearchParams).toEqual({
      limit: '8',
      offset: '3',
      organizations: ['42', '43'],
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
        '?organizations=42&organizations=43&offset=999&limit=0';
      render(<TestComponent />);
      {
        const [courseSearchParams, dispatch] = getLatestHookValues();
        expect(courseSearchParams).toEqual({
          limit: '0',
          offset: '999',
          organizations: ['42', '43'],
        });

        act(() =>
          dispatch({
            filter: {
              is_drilldown: false,
              name: 'organizations',
            },
            payload: '84',
            type: 'FILTER_ADD',
          }),
        );
      }
      {
        const [courseSearchParams] = getLatestHookValues();
        expect(courseSearchParams).toEqual({
          limit: '0',
          offset: '999',
          organizations: ['42', '43', '84'],
        });
        expect(mockWindow.history.pushState).toHaveBeenCalledTimes(1);
        expect(mockWindow.history.pushState).toHaveBeenCalledWith(
          null,
          '',
          '?limit=0&offset=999&organizations=42&organizations=43&organizations=84',
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
            payload: '83',
            type: 'FILTER_ADD',
          }),
        );
      }
      {
        const [courseSearchParams] = getLatestHookValues();
        expect(courseSearchParams).toEqual({
          limit: '999',
          offset: '0',
          organizations: ['83'],
          query: 'some query',
        });
        expect(mockWindow.history.pushState).toHaveBeenCalledTimes(1);
        expect(mockWindow.history.pushState).toHaveBeenCalledWith(
          null,
          '',
          '?limit=999&offset=0&organizations=83&query=some%20query',
        );
      }
    });

    it('does nothing if the value is already in the list for this filter', () => {
      mockWindow.location.search =
        '?limit=999&offset=0&query=some%20query&organizations=43';
      render(<TestComponent />);
      {
        const [courseSearchParams, dispatch] = getLatestHookValues();
        expect(courseSearchParams).toEqual({
          limit: '999',
          offset: '0',
          organizations: '43',
          query: 'some query',
        });

        act(() =>
          dispatch({
            filter: {
              is_drilldown: false,
              name: 'organizations',
            },
            payload: '43',
            type: 'FILTER_ADD',
          }),
        );
      }
      {
        const [courseSearchParams] = getLatestHookValues();
        expect(courseSearchParams).toEqual({
          limit: '999',
          offset: '0',
          organizations: ['43'],
          query: 'some query',
        });
        expect(mockWindow.history.pushState).not.toHaveBeenCalled();
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
            payload: 'advanced',
            type: 'FILTER_ADD',
          }),
        );
      }
      {
        const [courseSearchParams] = getLatestHookValues();
        expect(courseSearchParams).toEqual({
          level: 'advanced',
          limit: '999',
          offset: '0',
        });
        expect(mockWindow.history.pushState).toHaveBeenCalledTimes(1);
        expect(mockWindow.history.pushState).toHaveBeenCalledWith(
          null,
          '',
          '?level=advanced&limit=999&offset=0',
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
            payload: 'intermediate',
            type: 'FILTER_ADD',
          }),
        );
      }
      {
        const [courseSearchParams] = getLatestHookValues();
        expect(courseSearchParams).toEqual({
          level: 'intermediate',
          limit: '999',
          offset: '0',
        });
        expect(mockWindow.history.pushState).toHaveBeenCalledTimes(1);
        expect(mockWindow.history.pushState).toHaveBeenCalledWith(
          null,
          '',
          '?level=intermediate&limit=999&offset=0',
        );
      }
    });

    it('does nothing if the value was already on the filter', () => {
      mockWindow.location.search = '?level=beginner&limit=999&offset=0';
      render(<TestComponent />);
      {
        const [courseSearchParams, dispatch] = getLatestHookValues();
        expect(courseSearchParams).toEqual({
          level: 'beginner',
          limit: '999',
          offset: '0',
        });

        act(() =>
          dispatch({
            filter: {
              is_drilldown: true,
              name: 'level',
            },
            payload: 'beginner',
            type: 'FILTER_ADD',
          }),
        );
      }
      {
        const [courseSearchParams] = getLatestHookValues();
        expect(courseSearchParams).toEqual({
          level: 'beginner',
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
        '?limit=999&offset=0&query=some%20query&organizations=43&organizations=47';
      render(<TestComponent />);
      {
        const [courseSearchParams, dispatch] = getLatestHookValues();
        expect(courseSearchParams).toEqual({
          limit: '999',
          offset: '0',
          organizations: ['43', '47'],
          query: 'some query',
        });

        act(() =>
          dispatch({
            filter: {
              is_drilldown: false,
              name: 'organizations',
            },
            payload: '43',
            type: 'FILTER_REMOVE',
          }),
        );
      }
      {
        const [courseSearchParams] = getLatestHookValues();
        expect(courseSearchParams).toEqual({
          limit: '999',
          offset: '0',
          organizations: ['47'],
          query: 'some query',
        });
        expect(mockWindow.history.pushState).toHaveBeenCalledTimes(1);
        expect(mockWindow.history.pushState).toHaveBeenCalledWith(
          null,
          '',
          '?limit=999&offset=0&organizations=47&query=some%20query',
        );
      }
    });

    it('does nothing if there was no list for this filter', () => {
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
              name: 'categories',
            },
            payload: '123',
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
        '?limit=999&offset=0&organizations=42&organizations=43';
      render(<TestComponent />);
      {
        const [courseSearchParams, dispatch] = getLatestHookValues();
        expect(courseSearchParams).toEqual({
          limit: '999',
          offset: '0',
          organizations: ['42', '43'],
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
          organizations: ['42', '43'],
        });
        expect(mockWindow.history.pushState).not.toHaveBeenCalled();
      }
    });
  });

  describe('FILTER_REMOVE [drilldown]', () => {
    it('removes the value from the filter', () => {
      mockWindow.location.search =
        '?level=beginner&limit=999&offset=0&query=some%20query';
      render(<TestComponent />);
      {
        const [courseSearchParams, dispatch] = getLatestHookValues();
        expect(courseSearchParams).toEqual({
          level: 'beginner',
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
            payload: 'beginner',
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
        '?level=beginner&limit=999&offset=0&query=some%20query';
      render(<TestComponent />);
      {
        const [courseSearchParams, dispatch] = getLatestHookValues();
        expect(courseSearchParams).toEqual({
          level: 'beginner',
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
            payload: 'advanced',
            type: 'FILTER_REMOVE',
          }),
        );
      }
      {
        const [courseSearchParams] = getLatestHookValues();
        expect(courseSearchParams).toEqual({
          level: 'beginner',
          limit: '999',
          offset: '0',
          query: 'some query',
        });
        expect(mockWindow.history.pushState).not.toHaveBeenCalled();
      }
    });

    it('does nothing if there was already no value for this filter', () => {
      mockWindow.location.search =
        '?organizations=43&limit=999&offset=0&query=some%20query';
      render(<TestComponent />);
      {
        const [courseSearchParams, dispatch] = getLatestHookValues();
        expect(courseSearchParams).toEqual({
          limit: '999',
          offset: '0',
          organizations: '43',
          query: 'some query',
        });

        act(() =>
          dispatch({
            filter: {
              is_drilldown: true,
              name: 'level',
            },
            payload: 'intermediate',
            type: 'FILTER_REMOVE',
          }),
        );
      }
      {
        const [courseSearchParams] = getLatestHookValues();
        expect(courseSearchParams).toEqual({
          limit: '999',
          offset: '0',
          organizations: '43',
          query: 'some query',
        });
        expect(mockWindow.history.pushState).not.toHaveBeenCalled();
      }
    });
  });
});

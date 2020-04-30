import { act, render } from '@testing-library/react';
import React from 'react';

import { history, location } from 'utils/indirection/window';
import { useHistory } from '.';

jest.mock('utils/indirection/window', () => ({
  history: {
    pushState: jest.fn(),
    replaceState: jest.fn(),
  },
  location: {
    pathname: '/to/the/path',
    search: '?param1=value1&param2=value2',
  },
}));

describe('data/useHistory', () => {
  // Build a helper component with an out-of-scope function to let us reach our Hook from
  // our test cases.
  let getLatestHookValues: any;
  const TestComponent = ({}: {}) => {
    const hookValues = useHistory();
    getLatestHookValues = () => hookValues;
    return <div />;
  };

  afterEach(() => {
    location.pathname = '/to/the/path';
    location.search = '?param1=value1&param2=value2';
  });

  it('makes the current history entry available at bootstrap', () => {
    render(<TestComponent />);
    const [historyEntry] = getLatestHookValues();
    expect(historyEntry).toEqual({
      state: {
        name: '',
        data: { params: { param1: 'value1', param2: 'value2' } },
      },
      title: '',
      url: '/to/the/path?param1=value1&param2=value2',
    });
  });

  it('re-renders with a new value when the popstate event is fired', () => {
    {
      // Assert our initial values
      render(<TestComponent />);
      const [historyEntry] = getLatestHookValues();
      expect(historyEntry).toEqual({
        state: {
          name: '',
          data: { params: { param1: 'value1', param2: 'value2' } },
        },
        title: '',
        url: '/to/the/path?param1=value1&param2=value2',
      });
    }
    {
      // Change location to make sure our history entry is updated
      location.pathname = '/the/new/path';
      location.search = '?param3=value3';
      // Trigger the popstate event (simulates another independent component using pushState)
      const event: any = new CustomEvent('popstate');
      event.state = { param3: 'value3' };
      act(() => {
        window.dispatchEvent(event);
      });
      const [historyEntry] = getLatestHookValues();
      expect(historyEntry).toEqual({
        state: { param3: 'value3' },
        title: '',
        url: '/the/new/path?param3=value3',
      });
    }
  });

  it('provides a pushState helper that creates a new history entry', () => {
    {
      // Assert our initial values
      render(<TestComponent />);
      const [historyEntry, pushState] = getLatestHookValues();
      expect(historyEntry).toEqual({
        state: {
          name: '',
          data: { params: { param1: 'value1', param2: 'value2' } },
        },
        title: '',
        url: '/to/the/path?param1=value1&param2=value2',
      });
      // Trigger a pushState ourselves
      act(() => {
        pushState(
          { param4: 'value4', param5: 'value5' },
          '',
          '/the/third/path?param4=value4&param5=value5',
        );
      });
    }
    {
      // State was changed in the hook
      const [historyEntry] = getLatestHookValues();
      expect(historyEntry).toEqual({
        state: { param4: 'value4', param5: 'value5' },
        title: '',
        url: '/the/third/path?param4=value4&param5=value5',
      });
      // Actual browser history API was used
      expect(history.pushState).toHaveBeenCalledWith(
        { param4: 'value4', param5: 'value5' },
        '',
        '/the/third/path?param4=value4&param5=value5',
      );
    }
  });

  it('provides a replaceState helper that replaces the current history entry', () => {
    {
      // Assert our initial values
      render(<TestComponent />);
      const [historyEntry, , replaceState] = getLatestHookValues();
      expect(historyEntry).toEqual({
        state: {
          name: '',
          data: { params: { param1: 'value1', param2: 'value2' } },
        },
        title: '',
        url: '/to/the/path?param1=value1&param2=value2',
      });
      // Trigger a replaceState ourselves
      act(() => {
        replaceState(
          { param6: 'value6', param7: 'value7' },
          '',
          '/the/third/path?param6=value6&param7=value7',
        );
      });
    }
    {
      // State was changed in the hook
      const [historyEntry] = getLatestHookValues();
      expect(historyEntry).toEqual({
        state: { param6: 'value6', param7: 'value7' },
        title: '',
        url: '/the/third/path?param6=value6&param7=value7',
      });
      // Actual browser history API was used
      expect(history.replaceState).toHaveBeenCalledWith(
        { param6: 'value6', param7: 'value7' },
        '',
        '/the/third/path?param6=value6&param7=value7',
      );
    }
  });
});

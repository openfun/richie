import { act, renderHook } from '@testing-library/react';
import { PropsWithChildren } from 'react';

import { history, location } from 'utils/indirection/window';
import { HistoryProvider, useHistory } from '.';

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

describe('hooks/useHistory', () => {
  const wrapper = ({ children }: PropsWithChildren<any>) => (
    <HistoryProvider>{children}</HistoryProvider>
  );

  afterEach(() => {
    location.pathname = '/to/the/path';
    location.search = '?param1=value1&param2=value2';
  });

  it('makes the current history entry available at bootstrap', () => {
    const { result } = renderHook(useHistory, { wrapper });
    const [historyEntry] = result.current;

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
    const { result } = renderHook(useHistory, { wrapper });
    let [historyEntry] = result.current;

    expect(historyEntry).toEqual({
      state: {
        name: '',
        data: { params: { param1: 'value1', param2: 'value2' } },
      },
      title: '',
      url: '/to/the/path?param1=value1&param2=value2',
    });

    // Change location to make sure our history entry is updated
    location.pathname = '/the/new/path';
    location.search = '?param3=value3';

    // Trigger the popstate event (simulates another independent component using pushState)
    const event: any = new CustomEvent('popstate');
    event.state = { param3: 'value3' };

    act(() => {
      window.dispatchEvent(event);
    });

    [historyEntry] = result.current;
    expect(historyEntry).toEqual({
      state: { param3: 'value3' },
      title: '',
      url: '/the/new/path?param3=value3',
    });
  });

  it('provides a pushState helper that creates a new history entry', () => {
    const { result } = renderHook(useHistory, { wrapper });
    let [historyEntry] = result.current;
    const [, pushState] = result.current;

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

    // State was changed in the hook
    [historyEntry] = result.current;
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
  });

  it('provides a replaceState helper that replaces the current history entry', () => {
    const { result } = renderHook(useHistory, { wrapper });
    let [historyEntry] = result.current;
    const [, , replaceState] = result.current;

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

    // State was changed in the hook
    [historyEntry] = result.current;
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
  });
});

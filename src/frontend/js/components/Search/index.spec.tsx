import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { stringify } from 'query-string';
import { IntlProvider } from 'react-intl';

import { History, HistoryContext } from 'data/useHistory';
import * as mockWindow from 'utils/indirection/window';
import { ContextFactory } from 'utils/test/factories';
import { CommonDataProps } from 'types/commonDataProps';
import { Search } from '.';

let mockMatches = false;
jest.mock('utils/indirection/window', () => ({
  history: { pushState: jest.fn() },
  location: { search: '' },
  matchMedia: () => ({ matches: mockMatches }),
  scroll: jest.fn(),
}));

describe('<Search />', () => {
  const historyPushState = jest.fn();
  const historyReplaceState = jest.fn();
  const makeHistoryOf: (params: any) => History = ({ lastDispatchActions, ...params }) => [
    {
      state: { name: 'courseSearch', data: { params, lastDispatchActions } },
      title: '',
      url: `/search?${stringify(params)}`,
    },
    historyPushState,
    historyReplaceState,
  ];

  const contextProps: CommonDataProps['context'] = ContextFactory().generate();

  beforeEach(() => {
    fetchMock.restore();
    jest.resetAllMocks();
  });

  it('shows a spinner while the results are loading', async () => {
    fetchMock.get('/api/v1.0/courses/?limit=20&offset=0', {
      meta: {
        total_count: 200,
      },
      objects: [],
    });

    render(
      <IntlProvider locale="en">
        <HistoryContext.Provider value={makeHistoryOf({ limit: '20', offset: '0' })}>
          <Search context={contextProps} />
        </HistoryContext.Provider>
      </IntlProvider>,
    );

    expect(screen.getByText('Loading search results...').parentElement).toHaveAttribute(
      'role',
      'status',
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading search results...')).toBeNull();
    });
  });

  it('shows an error message when it fails to get the results', async () => {
    fetchMock.get('/api/v1.0/courses/?limit=20&offset=0', 500);

    render(
      <IntlProvider locale="en">
        <HistoryContext.Provider value={makeHistoryOf({ limit: '20', offset: '0' })}>
          <Search context={contextProps} />
        </HistoryContext.Provider>
      </IntlProvider>,
    );

    expect(screen.getByText('Loading search results...').parentElement).toHaveAttribute(
      'role',
      'status',
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading search results...')).toBeNull();
    });
    screen.getByText(`Something's wrong! Courses could not be loaded.`);
  });

  it('always shows the filters pane on large screens', async () => {
    fetchMock.get('/api/v1.0/courses/?limit=20&offset=0', {
      meta: {
        total_count: 200,
      },
      objects: [],
    });

    mockMatches = true;
    const { container } = render(
      <IntlProvider locale="en">
        <HistoryContext.Provider value={makeHistoryOf({ limit: '20', offset: '0' })}>
          <Search context={contextProps} />
        </HistoryContext.Provider>
      </IntlProvider>,
    );

    await waitFor(() => {
      // The search filters pane is not hidden, there is no button to show/hide it
      expect(container.querySelector('.search-filters-pane')).toHaveAttribute(
        'aria-hidden',
        'false',
      );
    });
    expect(container.querySelector('.search__filters__toggle')).toEqual(null);
  });

  it('hides the filters pane on small screens by default and lets users show it', async () => {
    fetchMock.get('/api/v1.0/courses/?limit=20&offset=0', {
      meta: {
        total_count: 200,
      },
      objects: [],
    });

    mockMatches = false;
    const { container } = render(
      <IntlProvider locale="en">
        <HistoryContext.Provider value={makeHistoryOf({ limit: '20', offset: '0' })}>
          <Search context={contextProps} />
        </HistoryContext.Provider>
      </IntlProvider>,
    );

    await waitFor(() => {
      // The search filters pane is hidden, there is a button to show/hide it
      expect(container.querySelector('.search-filters-pane')).toHaveAttribute(
        'aria-hidden',
        'true',
      );
    });
    expect(container.querySelector('.search__filters__toggle')).toEqual(
      jasmine.any(HTMLButtonElement),
    );

    {
      // We have a "Show" button with the appropriate aria helper
      expect(screen.queryByText('Hide filters pane')).toEqual(null);
      const button = screen.getByText('Show filters pane');
      expect(container.querySelector('.search__filters__toggle')).toHaveAttribute(
        'aria-expanded',
        'false',
      );

      // After a click the filters pane is now shown
      fireEvent.click(button);
      expect(container.querySelector('.search-filters-pane')).toHaveAttribute(
        'aria-hidden',
        'false',
      );
    }
    {
      // We now have a "Hide" button with the appropriate aria helper
      expect(screen.queryByText('Show filters pane')).toEqual(null);
      const button = screen.getByText('Hide filters pane');
      expect(container.querySelector('.search__filters__toggle')).toHaveAttribute(
        'aria-expanded',
        'true',
      );

      // After another click the filters pane is hidden again
      fireEvent.click(button);
      expect(container.querySelector('.search-filters-pane')).toHaveAttribute(
        'aria-hidden',
        'true',
      );
    }
  });

  it('should scroll up when filters have changed and courses are retrieved', async () => {
    await act(async () => {
      fetchMock.get('/api/v1.0/courses/?limit=20&offset=0', {
        meta: {
          total_count: 200,
        },
        objects: [],
      });

      render(
        <IntlProvider locale="en">
          <HistoryContext.Provider
            value={makeHistoryOf({
              limit: '20',
              offset: '0',
              lastDispatchActions: [{ type: 'FILTER_RESET' }],
            })}
          >
            <Search context={contextProps} />
          </HistoryContext.Provider>
        </IntlProvider>,
      );
    });

    expect(mockWindow.scroll).toHaveBeenCalledWith({
      behavior: 'smooth',
      top: 0,
    });
  });

  it('should not scroll up when filter changes contain QUERY_UPDATE', async () => {
    await act(async () => {
      render(
        <IntlProvider locale="en">
          <HistoryContext.Provider
            value={makeHistoryOf({
              lastDispatchActions: [{ type: 'QUERY_UPDATE' }],
            })}
          >
            <Search context={contextProps} />
          </HistoryContext.Provider>
        </IntlProvider>,
      );
    });

    expect(mockWindow.scroll).not.toHaveBeenCalled();
  });
});

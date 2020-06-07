import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { stringify } from 'query-string';
import React from 'react';
import { IntlProvider } from 'react-intl';

import { History, HistoryContext } from 'data/useHistory';
import { Search } from '.';

let mockMatches = false;
jest.mock('utils/indirection/window', () => ({
  history: { pushState: jest.fn() },
  location: { search: '' },
  matchMedia: () => {
    return { matches: mockMatches };
  },
}));

describe('<Search />', () => {
  const historyPushState = jest.fn();
  const historyReplaceState = jest.fn();
  const makeHistoryOf: (params: any) => History = (params) => [
    {
      state: { name: 'courseSearch', data: { params } },
      title: '',
      url: `/search?${stringify(params)}`,
    },
    historyPushState,
    historyReplaceState,
  ];

  const commonDataProps = {
    assets: {
      icons: '/icons.svg',
    },
    csrftoken: 'the csrf token',
    environment: 'frontend_tests',
    release: '9.8.7',
    sentry_dsn: null,
  };

  beforeEach(() => fetchMock.restore());

  it('shows a spinner while the results are loading', async () => {
    fetchMock.get('/api/v1.0/courses/?limit=20&offset=0', {
      meta: {
        total_count: 200,
      },
      objects: [],
    });

    render(
      <IntlProvider locale="en">
        <HistoryContext.Provider
          value={makeHistoryOf({ limit: '20', offset: '0' })}
        >
          <Search context={commonDataProps} />
        </HistoryContext.Provider>
      </IntlProvider>,
    );

    expect(
      screen.getByText('Loading search results...').parentElement,
    ).toHaveAttribute('role', 'status');

    await waitFor(() => {
      expect(screen.queryByText('Loading search results...')).toBeNull();
    });
  });

  it('shows an error message when it fails to get the results', async () => {
    fetchMock.get('/api/v1.0/courses/?limit=20&offset=0', 500);

    render(
      <IntlProvider locale="en">
        <HistoryContext.Provider
          value={makeHistoryOf({ limit: '20', offset: '0' })}
        >
          <Search context={commonDataProps} />
        </HistoryContext.Provider>
      </IntlProvider>,
    );

    expect(
      screen.getByText('Loading search results...').parentElement,
    ).toHaveAttribute('role', 'status');

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
        <HistoryContext.Provider
          value={makeHistoryOf({ limit: '20', offset: '0' })}
        >
          <Search context={commonDataProps} />
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
        <HistoryContext.Provider
          value={makeHistoryOf({ limit: '20', offset: '0' })}
        >
          <Search context={commonDataProps} />
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
      expect(
        container.querySelector('.search__filters__toggle'),
      ).toHaveAttribute('aria-expanded', 'false');

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
      expect(
        container.querySelector('.search__filters__toggle'),
      ).toHaveAttribute('aria-expanded', 'true');

      // After another click the filters pane is hidden again
      fireEvent.click(button);
      expect(container.querySelector('.search-filters-pane')).toHaveAttribute(
        'aria-hidden',
        'true',
      );
    }
  });
});

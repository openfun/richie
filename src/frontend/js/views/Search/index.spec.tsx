import { QueryClientProvider } from 'react-query';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { stringify } from 'query-string';
import { IntlProvider } from 'react-intl';

import { History, HistoryContext } from 'data/useHistory';
import * as mockWindow from 'utils/indirection/window';
import { ContextFactory as mockContextFactory } from 'utils/test/factories';
import createQueryClient from 'utils/react-query/createQueryClient';
import context from 'utils/context';
import Search from '.';

let mockMatches = false;
jest.mock('utils/indirection/window', () => ({
  history: { pushState: jest.fn() },
  location: { search: '' },
  matchMedia: () => ({
    matches: mockMatches,
    addListener: jest.fn(),
    removeListener: jest.fn(),
  }),
  scroll: jest.fn(),
}));

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockContextFactory().generate(),
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
  const queryClient = createQueryClient();

  afterEach(() => {
    queryClient.clear();
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
      <QueryClientProvider client={queryClient}>
        <IntlProvider locale="en">
          <HistoryContext.Provider value={makeHistoryOf({ limit: '20', offset: '0' })}>
            <Search context={context} />
          </HistoryContext.Provider>
        </IntlProvider>
      </QueryClientProvider>,
    );

    expect(screen.getByText('Loading search results...').parentElement).toHaveAttribute(
      'role',
      'status',
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading search results...')).toBeNull();
    });
  });

  it('shows the results and a warning message when there is a text query that is too short', async () => {
    // Note: this can happen when loading <Search /> with a short text query already in the query string
    fetchMock.get('/api/v1.0/courses/?limit=20&offset=0', {
      // NB: query is absent from API request query string
      meta: {
        total_count: 200,
      },
      objects: [
        {
          absolute_url: '/en/courses/vision-oriented-systemic-implementation/',
          cover_image: {
            sizes: '300px',
            src: '/some/image.jpg',
            srcset: '/some/image.jpg *',
          },
          duration: '2 days',
          effort: '425 minutes',
          icon: null,
          introduction: 'Politics some never so various mean. American society long building.',
          title: 'Vision-oriented systemic implementation',
          id: '346',
          categories: ['40', '46', '60', '104'],
          code: '00027',
          organization_highlighted: 'Object-based analyzing time-frame',
          organizations: ['170', '186', '190'],
          state: {
            priority: 3,
            datetime: '2022-04-30T18:45:31Z',
            call_to_action: null,
            text: 'starting on',
          },
        },
      ],
    });

    render(
      <QueryClientProvider client={queryClient}>
        <IntlProvider locale="en">
          <HistoryContext.Provider value={makeHistoryOf({ limit: '20', offset: '0', query: 'vi' })}>
            <Search context={context} />
          </HistoryContext.Provider>
        </IntlProvider>
      </QueryClientProvider>,
    );

    // Wait for search results to be loaded
    await waitFor(() => {
      expect(screen.queryByText('Loading search results...')).toBeNull();
    });

    screen.getByText('Vision-oriented systemic implementation');
    screen.getByText((content) =>
      content.startsWith('Text search requires at least 3 characters.'),
    );
  });

  it('shows an error message when it fails to get the results', async () => {
    fetchMock.get('/api/v1.0/courses/?limit=20&offset=0', 500);

    render(
      <QueryClientProvider client={queryClient}>
        <IntlProvider locale="en">
          <HistoryContext.Provider value={makeHistoryOf({ limit: '20', offset: '0' })}>
            <Search context={context} />
          </HistoryContext.Provider>
        </IntlProvider>
      </QueryClientProvider>,
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
      <QueryClientProvider client={queryClient}>
        <IntlProvider locale="en">
          <HistoryContext.Provider value={makeHistoryOf({ limit: '20', offset: '0' })}>
            <Search context={context} />
          </HistoryContext.Provider>
        </IntlProvider>
      </QueryClientProvider>,
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
      <QueryClientProvider client={queryClient}>
        <IntlProvider locale="en">
          <HistoryContext.Provider value={makeHistoryOf({ limit: '20', offset: '0' })}>
            <Search context={context} />
          </HistoryContext.Provider>
        </IntlProvider>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      // The search filters pane is hidden, there is a button to show/hide it
      expect(container.querySelector('.search-filters-pane')).toHaveAttribute(
        'aria-hidden',
        'true',
      );
    });
    expect(container.querySelector('.search__filters__toggle')).toBeInstanceOf(HTMLButtonElement);

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
        <QueryClientProvider client={queryClient}>
          <IntlProvider locale="en">
            <HistoryContext.Provider
              value={makeHistoryOf({
                limit: '20',
                offset: '0',
                lastDispatchActions: [{ type: 'FILTER_RESET' }],
              })}
            >
              <Search context={context} />
            </HistoryContext.Provider>
          </IntlProvider>
        </QueryClientProvider>,
      );
    });

    expect(mockWindow.scroll).toHaveBeenCalledWith({
      behavior: 'smooth',
      top: 0,
    });
  });

  it('should not scroll up when filter changes contain QUERY_UPDATE', async () => {
    await act(async () => {
      fetchMock.get('/api/v1.0/courses/?limit=20&offset=0', {
        meta: {
          total_count: 200,
        },
        objects: [],
      });

      render(
        <QueryClientProvider client={queryClient}>
          <IntlProvider locale="en">
            <HistoryContext.Provider
              value={makeHistoryOf({
                limit: '20',
                offset: '0',
                lastDispatchActions: [{ type: 'QUERY_UPDATE' }],
              })}
            >
              <Search context={context} />
            </HistoryContext.Provider>
          </IntlProvider>
        </QueryClientProvider>,
      );
    });

    expect(mockWindow.scroll).not.toHaveBeenCalled();
  });
});

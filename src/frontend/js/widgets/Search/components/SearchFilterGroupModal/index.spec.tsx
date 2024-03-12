import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import { range } from 'lodash-es';
import queryString from 'query-string';
import { IntlProvider } from 'react-intl';
import { QueryClientProvider } from '@tanstack/react-query';
import { History, HistoryContext } from 'hooks/useHistory';
import { Deferred } from 'utils/test/deferred';
import { resolveAll } from 'utils/resolveAll';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import { render } from 'utils/test/render';
import { SearchFilterGroupModal } from '.';

jest.mock('utils/errors/handle', () => ({ handle: jest.fn() }));

jest.mock('utils/indirection/window', () => ({
  location: { pathname: '/', search: '' },
  matchMedia: () => ({
    matches: true,
  }),
}));

jest.mock('hooks/useIntersectionObserver', () => ({
  useIntersectionObserver: (props: any) => {
    (globalThis as any).__intersection_observer_props__ = props;
  },
}));

const filter = {
  base_path: '0001',
  has_more_values: false,
  human_name: 'Universities',
  is_autocompletable: true,
  is_searchable: true,
  name: 'universities',
  position: 0,
  values: [
    {
      count: 4,
      human_name: 'Value One',
      key: 'P-00010001',
    },
    {
      count: 7,
      human_name: 'Value Two',
      key: 'L-00010002',
    },
  ],
};

describe('<SearchFilterGroupModal />', () => {
  const historyPushState = jest.fn();
  const historyReplaceState = jest.fn();
  const makeHistoryOf: (params: any) => History = (params) => [
    {
      state: { name: 'courseSearch', data: { params } },
      title: '',
      url: `/search?${queryString.stringify(params)}`,
    },
    historyPushState,
    historyReplaceState,
  ];

  it('renders a button with a modal to search values for a given filter', async () => {
    {
      const universitiesDeferred = new Deferred();
      fetchMock.get('/api/v1.0/universities/?limit=21&offset=0', universitiesDeferred.promise);
      const coursesDeferred = new Deferred();
      fetchMock.get(
        '/api/v1.0/courses/?facet_sorting=name&limit=21&offset=0&scope=filters&universities_aggs=' +
          range(0, 21).join('&universities_aggs='),
        coursesDeferred.promise,
      );

      render(
        <IntlProvider locale="en">
          <HistoryContext.Provider value={makeHistoryOf({ limit: '21', offset: '0' })}>
            <QueryClientProvider client={createTestQueryClient()}>
              <SearchFilterGroupModal filter={filter} />
            </QueryClientProvider>
          </HistoryContext.Provider>
        </IntlProvider>,
        { wrapper: null },
      );

      // The modal is not rendered
      expect(screen.queryByText('Add filters for Universities')).toEqual(null);
      expect(screen.queryByPlaceholderText('Search in Universities')).toEqual(null);

      // The modal is rendered
      const openButton = screen.getByText('More options');
      // Make sure there is a more explicit text for screen readers
      screen.getByRole('button', { name: 'More options (Universities)' });
      fireEvent.click(openButton);
      screen.getByText('Loading search results...');

      await act(async () =>
        universitiesDeferred.resolve({
          meta: {
            offset: 0,
            count: 21,
            total_count: 46,
          },
          objects: range(0, 21).map((id) => ({ id: String(id) })),
        }),
      );
      screen.getByText('Loading search results...');

      await act(async () =>
        coursesDeferred.resolve({
          filters: {
            universities: {
              values: range(0, 21).map((id) => ({
                count: id * 100,
                human_name: `Value #${id}`,
                key: String(id),
              })),
            },
          },
        }),
      );

      screen.getByText('Add filters for Universities');
      screen.getByPlaceholderText('Search in Universities');

      // Default search results are shown with their facet counts;
      await resolveAll(range(0, 21), async (value) => {
        await screen.findByText(
          (content) =>
            content.startsWith(`Value #${value} `) && content.includes(String(value * 100)),
        );
      });
    }
    {
      // Activate intersection observer, make sure more results are loaded
      const universitiesDeferred = new Deferred();
      fetchMock.get('/api/v1.0/universities/?limit=21&offset=21', universitiesDeferred.promise);
      const coursesDeferred = new Deferred();
      fetchMock.get(
        '/api/v1.0/courses/?facet_sorting=name&limit=21&offset=0&scope=filters&universities_aggs=' +
          range(21, 42).join('&universities_aggs='),
        coursesDeferred.promise,
      );

      const { onIntersect } = (globalThis as any).__intersection_observer_props__;
      onIntersect();
      await act(async () =>
        universitiesDeferred.resolve({
          meta: {
            offset: 21,
            count: 21,
            total_count: 46,
          },
          objects: range(21, 42).map((id) => ({ id: String(id) })),
        }),
      );
      await act(async () =>
        coursesDeferred.resolve({
          filters: {
            universities: {
              values: range(21, 42).map((id) => ({
                count: id * 100,
                human_name: `Value #${id}`,
                key: String(id),
              })),
            },
          },
        }),
      );

      // Search results including top 21 and next 21 are shown with their facet counts
      await resolveAll(range(0, 42), async (value) => {
        await screen.findByText(
          (content) =>
            content.startsWith(`Value #${value} `) && content.includes(String(value * 100)),
        );
      });
    }
    {
      // Click on the "more results" button, make sure more results are loaded
      const universitiesDeferred = new Deferred();
      fetchMock.get('/api/v1.0/universities/?limit=21&offset=42', universitiesDeferred.promise);
      const coursesDeferred = new Deferred();
      fetchMock.get(
        '/api/v1.0/courses/?facet_sorting=name&limit=21&offset=0&scope=filters&universities_aggs=' +
          range(42, 46).join('&universities_aggs='),
        coursesDeferred.promise,
      );

      await userEvent.click(screen.getByText('Load more results'));
      await act(async () =>
        universitiesDeferred.resolve({
          meta: {
            offset: 42,
            count: 4,
            total_count: 46,
          },
          objects: range(42, 46).map((id) => ({ id: String(id) })),
        }),
      );
      await act(async () =>
        coursesDeferred.resolve({
          filters: {
            universities: {
              values: range(42, 46).map((id) => ({
                count: id * 100,
                human_name: `Value #${id}`,
                key: String(id),
              })),
            },
          },
        }),
      );

      // All three batches of search results are displayed along with facet counts
      await resolveAll(range(0, 46), async (value) => {
        await screen.findByText(
          (content) =>
            content.startsWith(`Value #${value} `) && content.includes(String(value * 100)),
        );
      });
    }
  });

  it('searches as the user types', async () => {
    {
      const universitiesDeferred = new Deferred();
      fetchMock.get('/api/v1.0/universities/?limit=21&offset=0', universitiesDeferred.promise);
      const coursesDeferred = new Deferred();
      fetchMock.get(
        '/api/v1.0/courses/?facet_sorting=name&limit=21&offset=0&scope=filters&universities_aggs=L-42&universities_aggs=L-84&universities_aggs=L-99',
        coursesDeferred.promise,
      );

      render(
        <IntlProvider locale="en">
          <HistoryContext.Provider value={makeHistoryOf({ limit: '21', offset: '0' })}>
            <QueryClientProvider client={createTestQueryClient()}>
              <SearchFilterGroupModal filter={filter} />
            </QueryClientProvider>
          </HistoryContext.Provider>
        </IntlProvider>,
        { wrapper: null },
      );

      // The modal is rendered
      const openButton = screen.getByText('More options');
      fireEvent.click(openButton);
      screen.getByText('Loading search results...');

      await act(async () => {
        universitiesDeferred.resolve({
          meta: {
            offset: 0,
            count: 3,
            total_count: 3,
          },
          objects: [{ id: 'L-42' }, { id: 'L-84' }, { id: 'L-99' }],
        });
      });
      screen.getByText('Loading search results...');

      await act(async () => {
        coursesDeferred.resolve({
          filters: {
            universities: {
              values: [
                {
                  count: 7,
                  human_name: 'Value #42',
                  key: '42',
                },
                {
                  count: 12,
                  human_name: 'Value #84',
                  key: '84',
                },
              ],
            },
          },
        });
      });
    }

    screen.getByText('Add filters for Universities');
    const field = screen.getByPlaceholderText('Search in Universities');
    fireEvent.focus(field);

    // Default search results are shown with their facet counts
    await screen.findByText(
      (content) => content.startsWith('Value #42') && content.includes('(7)'),
    );
    screen.getByText((content) => content.startsWith('Value #84') && content.includes('(12)'));

    // User starts typing, less than 3 characters
    fetchMock.resetHistory();
    fireEvent.change(field, { target: { value: 'us' } });
    expect(fetchMock.called()).toEqual(false);
    screen.getByText('Type at least 3 characters to start searching.');

    {
      // User inputs a search query
      const universitiesDeferred = new Deferred();
      fetchMock.get(
        '/api/v1.0/universities/?limit=21&offset=0&query=user',
        universitiesDeferred.promise,
      );
      const coursesDeferred = new Deferred();
      fetchMock.get(
        '/api/v1.0/courses/?facet_sorting=name&limit=21&offset=0&scope=filters&universities_aggs=L-12&universities_aggs=L-17',
        coursesDeferred.promise,
      );
      fireEvent.change(field, { target: { value: 'user' } });
      await act(async () => {
        universitiesDeferred.resolve({
          meta: {
            count: 2,
            offset: 0,
            total_count: 2,
          },
          objects: [{ id: 'L-12' }, { id: 'L-17' }],
        });
      });
      await act(async () => {
        coursesDeferred.resolve({
          filters: {
            universities: {
              values: [
                {
                  count: 7,
                  human_name: 'Value #12',
                  key: '12',
                },
                {
                  count: 12,
                  human_name: 'Value #17',
                  key: '17',
                },
              ],
            },
          },
        });
      });
    }

    // New search results are shown with their facet counts
    await screen.findByText(
      (content) => content.startsWith('Value #12') && content.includes('(7)'),
    );
    screen.getByText((content) => content.startsWith('Value #17') && content.includes('(12)'));

    {
      // User further refines their search query
      const universitiesDeferred = new Deferred();
      fetchMock.get(
        '/api/v1.0/universities/?limit=21&offset=0&query=user%20input',
        universitiesDeferred.promise,
      );
      const coursesDeferred = new Deferred();
      fetchMock.get(
        '/api/v1.0/courses/?facet_sorting=name&limit=21&offset=0&scope=filters&universities_aggs=L-03&universities_aggs=L-66',
        coursesDeferred.promise,
      );
      fireEvent.change(field, { target: { value: 'user input' } });
      await act(async () => {
        universitiesDeferred.resolve({
          meta: {
            count: 2,
            offset: 0,
            total_count: 2,
          },
          objects: [{ id: 'L-03' }, { id: 'L-66' }],
        });
      });
      await act(async () => {
        coursesDeferred.resolve({
          filters: {
            universities: {
              values: [
                {
                  count: 12,
                  human_name: 'Value #03',
                  key: '03',
                },
                {
                  count: 2,
                  human_name: 'Value #66',
                  key: '66',
                },
              ],
            },
          },
        });
      });
    }

    // New search results are shown with their facet counts
    await screen.findByText(
      (content) => content.startsWith('Value #03') && content.includes('(12)'),
    );
    screen.getByText((content) => content.startsWith('Value #66') && content.includes('(2)'));
  });

  it('closes when the user clicks the close button', async () => {
    const universitiesDeferred = new Deferred();
    fetchMock.get('/api/v1.0/universities/?limit=21&offset=0', universitiesDeferred.promise);
    const coursesDeferred = new Deferred();
    fetchMock.get(
      '/api/v1.0/courses/?facet_sorting=name&limit=21&offset=0&scope=filters&universities_aggs=L-42&universities_aggs=L-84&universities_aggs=L-99',
      coursesDeferred.promise,
    );

    render(
      <IntlProvider locale="en">
        <HistoryContext.Provider value={makeHistoryOf({ limit: '21', offset: '0' })}>
          <QueryClientProvider client={createTestQueryClient()}>
            <SearchFilterGroupModal filter={filter} />
          </QueryClientProvider>
        </HistoryContext.Provider>
      </IntlProvider>,
      { wrapper: null },
    );

    // The modal is not rendered
    expect(screen.queryByText('Add filters for Universities')).toEqual(null);
    expect(screen.queryByPlaceholderText('Search in Universities')).toEqual(null);
    expect(screen.queryByText('Close dialog')).toEqual(null);

    // The modal is rendered
    const openButton = screen.getByText('More options');
    fireEvent.click(openButton);
    await act(async () => {
      universitiesDeferred.resolve({
        meta: { count: 3, offset: 0, total_count: 3 },
        objects: [{ id: 'L-42' }, { id: 'L-84' }, { id: 'L-99' }],
      });
    });
    await act(async () => {
      coursesDeferred.resolve({
        filters: {
          universities: {
            values: [],
          },
        },
      });
    });

    screen.getByText('Add filters for Universities');
    screen.getByPlaceholderText('Search in Universities');

    // User clicks on the close button
    const closeButton = screen.getByText('Close dialog');
    fireEvent.click(closeButton);

    // The modal is not rendered any more
    await waitFor(() => {
      expect(screen.queryByText('Add filters for Universities')).toEqual(null);
    });
    expect(screen.queryByPlaceholderText('Search in Universities')).toEqual(null);
    expect(screen.queryByText('Close dialog')).toEqual(null);
  });

  it('adds the value and closes when the user clicks a filter value', async () => {
    const universitiesDeferred = new Deferred();
    fetchMock.get('/api/v1.0/universities/?limit=21&offset=0', universitiesDeferred.promise);
    const coursesDeferred = new Deferred();
    fetchMock.get(
      '/api/v1.0/courses/?facet_sorting=name&limit=21&offset=0&scope=filters&universities_aggs=L-42&universities_aggs=L-84&universities_aggs=L-99',
      coursesDeferred.promise,
    );

    render(
      <IntlProvider locale="en">
        <HistoryContext.Provider value={makeHistoryOf({ limit: '21', offset: '0' })}>
          <QueryClientProvider client={createTestQueryClient()}>
            <SearchFilterGroupModal filter={filter} />
          </QueryClientProvider>
        </HistoryContext.Provider>
      </IntlProvider>,
      { wrapper: null },
    );

    // The modal is not rendered
    expect(screen.queryByText('Add filters for Universities')).toEqual(null);
    expect(screen.queryByPlaceholderText('Search in Universities')).toEqual(null);

    // The modal is rendered
    const openButton = screen.getByText('More options');
    fireEvent.click(openButton);
    await act(async () => {
      universitiesDeferred.resolve({
        meta: { count: 3, offset: 0, total_count: 3 },
        objects: [{ id: 'L-42' }, { id: 'L-84' }, { id: 'L-99' }],
      });
    });
    await act(async () => {
      coursesDeferred.resolve({
        filters: {
          universities: {
            values: [
              {
                count: 7,
                human_name: 'Value #42',
                key: '42',
              },
              {
                count: 12,
                human_name: 'Value #84',
                key: '84',
              },
            ],
          },
        },
      });
    });
    screen.getByText('Add filters for Universities');
    screen.getByPlaceholderText('Search in Universities');

    // Default search results are shown with their facet counts
    await screen.findByText(
      (content) => content.startsWith('Value #84') && content.includes('(12)'),
    );
    const value42 = screen.getByText(
      (content) => content.startsWith('Value #42') && content.includes('(7)'),
    );

    // User clicks Value #42, it is added to course search params through pushState
    fireEvent.click(value42);
    expect(historyPushState).toHaveBeenLastCalledWith(
      {
        name: 'courseSearch',
        data: {
          lastDispatchActions: expect.any(Array),
          params: {
            limit: '21',
            offset: '0',
            universities: ['42'],
          },
        },
      },
      '',
      '/?limit=21&offset=0&universities=42',
    );

    // The modal is not rendered any more
    expect(screen.queryByText('Add filters for Universities')).toEqual(null);
    expect(screen.queryByPlaceholderText('Search in Universities')).toEqual(null);
  });

  it('shows an error message when it fails to search for values', async () => {
    fetchMock.get('/api/v1.0/universities/?limit=21&offset=0', {
      throws: new Error('Failed to search for universities'),
    });

    render(
      <IntlProvider locale="en">
        <HistoryContext.Provider value={makeHistoryOf({ limit: '21', offset: '0' })}>
          <QueryClientProvider client={createTestQueryClient()}>
            <SearchFilterGroupModal filter={filter} />
          </QueryClientProvider>
        </HistoryContext.Provider>
      </IntlProvider>,
      { wrapper: null },
    );

    // The modal is not rendered
    expect(screen.queryByText('Add filters for Universities')).toEqual(null);
    expect(screen.queryByPlaceholderText('Search in Universities')).toEqual(null);

    // The modal is rendered
    const openButton = screen.getByText('More options');
    fireEvent.click(openButton);
    screen.getByText('Add filters for Universities');
    screen.getByPlaceholderText('Search in Universities');

    // The search request failed, the error is logged and a message is displayed
    await screen.findByText('There was an error while searching for Universities.');
  });

  it('shows an error message when it fails to get the actual filter', async () => {
    fetchMock.get('/api/v1.0/universities/?limit=21&offset=0', {
      objects: [{ id: 'L-42' }, { id: 'L-84' }, { id: 'L-99' }],
    });
    fetchMock.get(
      '/api/v1.0/courses/?facet_sorting=name&limit=21&offset=0&scope=filters&universities_aggs=L-42&universities_aggs=L-84&universities_aggs=L-99',
      { throws: new Error('Failed to search for universities') },
    );

    render(
      <IntlProvider locale="en">
        <HistoryContext.Provider value={makeHistoryOf({ limit: '21', offset: '0' })}>
          <QueryClientProvider client={createTestQueryClient()}>
            <SearchFilterGroupModal filter={filter} />
          </QueryClientProvider>
        </HistoryContext.Provider>
      </IntlProvider>,
      { wrapper: null },
    );

    // The modal is not rendered
    expect(screen.queryByText('Add filters for Universities')).toEqual(null);
    expect(screen.queryByPlaceholderText('Search in Universities')).toEqual(null);

    // The modal is rendered
    const openButton = screen.getByText('More options');
    fireEvent.click(openButton);
    screen.getByText('Add filters for Universities');
    screen.getByPlaceholderText('Search in Universities');

    // The filters request failed, the error is logged and a message is displayed
    await screen.findByText('There was an error while searching for Universities.');
  });
});

import { fireEvent, screen } from '@testing-library/react';
import queryString from 'query-string';
import { IntlProvider } from 'react-intl';
import { QueryClientProvider } from '@tanstack/react-query';

import { History, HistoryContext } from 'hooks/useHistory';
import { APIListRequestParams } from 'types/api';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import { render } from 'utils/test/render';
import { fetchList } from '../../utils/getResourceList';
import { RequestStatus } from '../../types/api';

import { SearchFilterValueParent } from '.';

jest.mock('utils/context', () => jest.fn());
jest.mock('../../utils/getResourceList', () => ({
  fetchList: jest.fn(),
}));

const mockFetchList: jest.MockedFunction<typeof fetchList> = fetchList as any;

describe('<SearchFilterValueParent />', () => {
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

  it('renders the parent filter value and a button to show the children', () => {
    const { getByLabelText, queryByLabelText } = render(
      <QueryClientProvider client={createTestQueryClient()}>
        <IntlProvider locale="en">
          <HistoryContext.Provider value={makeHistoryOf({ limit: '999', offset: '0' })}>
            <SearchFilterValueParent
              filter={{
                base_path: '00010002',
                has_more_values: false,
                human_name: 'Subjects',
                is_autocompletable: true,
                is_searchable: true,
                name: 'subjects',
                position: 0,
                values: [],
              }}
              value={{
                count: 12,
                human_name: 'Literature',
                key: 'P-00040005',
              }}
            />
          </HistoryContext.Provider>
        </IntlProvider>
      </QueryClientProvider>,
      { wrapper: null },
    );

    getByLabelText((content) => content.startsWith('Literature'));
    expect(getByLabelText('Show more filters for Literature')).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(queryByLabelText((content) => content.startsWith('Classical Literature'))).toEqual(null);
    expect(queryByLabelText((content) => content.startsWith('Modern Literature'))).toEqual(null);
  });

  it('shows the children when one of them is active', async () => {
    mockFetchList.mockResolvedValue({
      status: RequestStatus.SUCCESS,
      content: {
        filters: {
          subjects: {
            values: [
              {
                count: 3,
                human_name: 'Classical Literature',
                key: 'L-000400050003',
              },
              {
                count: 9,
                human_name: 'Modern Literature',
                key: 'L-000400050004',
              },
            ],
          },
        },
      },
    } as any);

    // Helper to get the React element with the expected params
    const getElement = (params: APIListRequestParams) => (
      <QueryClientProvider client={createTestQueryClient()}>
        <IntlProvider locale="en">
          <HistoryContext.Provider value={makeHistoryOf(params)}>
            <SearchFilterValueParent
              filter={{
                base_path: '00010002',
                has_more_values: false,
                human_name: 'Subjects',
                is_autocompletable: true,
                is_searchable: true,
                name: 'subjects',
                position: 0,
                values: [],
              }}
              value={{
                count: 12,
                human_name: 'Literature',
                key: 'P-00040005',
              }}
            />
          </HistoryContext.Provider>
        </IntlProvider>
      </QueryClientProvider>
    );
    const { getByLabelText, queryByLabelText, rerender } = render(
      getElement({ limit: '999', offset: '0', subjects: [] }),
      { wrapper: null },
    );

    // Children filters are not shown
    getByLabelText((content) => content.startsWith('Literature'));
    expect(queryByLabelText('Hide additional filters for Literature')).toEqual(null);
    expect(queryByLabelText((content) => content.startsWith('Classical Literature'))).toEqual(null);
    expect(queryByLabelText((content) => content.startsWith('Modern Literature'))).toEqual(null);

    // The params are updated, now include a child filter of Literature
    rerender(getElement({ limit: '999', offset: '0', subjects: ['L-000400050004'] }));

    await screen.findByLabelText((content) => content.startsWith('Classical Literature'));

    // The children filters are now shown along with an icon to hide them
    getByLabelText((content) => content.startsWith('Modern Literature'));
    const button = getByLabelText('Hide additional filters for Literature');
    expect(button).toHaveAttribute('aria-pressed', 'true');
  });

  it('hides/shows the children when the user clicks on the toggle button', async () => {
    mockFetchList.mockResolvedValue({
      status: RequestStatus.SUCCESS,
      content: {
        filters: {
          subjects: {
            values: [
              {
                count: 3,
                human_name: 'Classical Literature',
                key: 'L-000400050003',
              },
              {
                count: 9,
                human_name: 'Modern Literature',
                key: 'L-000400050004',
              },
            ],
          },
        },
      },
    } as any);

    const { getByLabelText, queryByLabelText } = render(
      <QueryClientProvider client={createTestQueryClient()}>
        <IntlProvider locale="en">
          <HistoryContext.Provider
            value={makeHistoryOf({
              limit: '999',
              offset: '0',
              subjects: ['L-000400050004'],
            })}
          >
            <SearchFilterValueParent
              filter={{
                base_path: '00010002',
                has_more_values: false,
                human_name: 'Subjects',
                is_autocompletable: true,
                is_searchable: true,
                name: 'subjects',
                position: 0,
                values: [],
              }}
              value={{
                count: 12,
                human_name: 'Literature',
                key: 'P-00040005',
              }}
            />
          </HistoryContext.Provider>
        </IntlProvider>
      </QueryClientProvider>,
      { wrapper: null },
    );

    getByLabelText((content) => content.startsWith('Literature'));
    expect(getByLabelText('Hide additional filters for Literature')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await screen.findByLabelText((content) => content.startsWith('Classical Literature'));
    getByLabelText((content) => content.startsWith('Modern Literature'));

    expect(mockFetchList).toHaveBeenCalledTimes(1);
    expect(mockFetchList).toHaveBeenLastCalledWith('courses', {
      limit: '999',
      offset: '0',
      scope: 'filters',
      subjects: ['L-000400050004'],
      subjects_children_aggs: 'P-00040005',
    });

    fireEvent.click(getByLabelText('Hide additional filters for Literature'));

    getByLabelText((content) => content.startsWith('Literature'));
    expect(getByLabelText('Show more filters for Literature')).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(queryByLabelText((content) => content.startsWith('Classical Literature'))).toEqual(null);
    expect(queryByLabelText((content) => content.startsWith('Modern Literature'))).toEqual(null);
    expect(mockFetchList).toHaveBeenCalledTimes(1);

    fireEvent.click(getByLabelText('Show more filters for Literature'));

    getByLabelText('Hide additional filters for Literature');
    expect(mockFetchList).toHaveBeenCalledTimes(2);
    expect(mockFetchList).toHaveBeenLastCalledWith('courses', {
      limit: '999',
      offset: '0',
      scope: 'filters',
      subjects: ['L-000400050004'],
      subjects_children_aggs: 'P-00040005',
    });
    expect(getByLabelText('Hide additional filters for Literature')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await screen.findByLabelText((content) => content.startsWith('Classical Literature'));
    getByLabelText((content) => content.startsWith('Modern Literature'));
  });

  it('shows the parent filter value itself as inactive when it is not in the search params', () => {
    const { getByLabelText } = render(
      <QueryClientProvider client={createTestQueryClient()}>
        <IntlProvider locale="en">
          <HistoryContext.Provider value={makeHistoryOf({ limit: '999', offset: '0' })}>
            <SearchFilterValueParent
              filter={{
                base_path: '0009',
                has_more_values: false,
                human_name: 'Filter name',
                is_autocompletable: true,
                is_searchable: true,
                name: 'filter_name',
                position: 0,
                values: [],
              }}
              value={{
                count: 217,
                human_name: 'Human name',
                key: 'P-00040005',
              }}
            />
          </HistoryContext.Provider>
        </IntlProvider>
      </QueryClientProvider>,
      { wrapper: null },
    );

    // The filter value is displayed with its facet count
    const checkbox = getByLabelText((content) => content.startsWith('Human name'));
    expect(checkbox!.parentElement).toHaveTextContent('(217)'); // label that contains checkbox
    // The filter is not currently active
    expect(checkbox).not.toHaveAttribute('checked');
    expect(checkbox!.parentElement!.parentElement).not.toHaveClass('active'); // parent self filter
  });

  it('disables the parent value when its count is 0', () => {
    const { getByLabelText } = render(
      <QueryClientProvider client={createTestQueryClient()}>
        <IntlProvider locale="en">
          <HistoryContext.Provider value={makeHistoryOf({ limit: '999', offset: '0' })}>
            <SearchFilterValueParent
              filter={{
                base_path: '0009',
                has_more_values: false,
                human_name: 'Filter name',
                is_autocompletable: true,
                is_searchable: true,
                name: 'filter_name',
                position: 0,
                values: [],
              }}
              value={{
                count: 0,
                human_name: 'Human name',
                key: 'P-00040005',
              }}
            />
          </HistoryContext.Provider>
        </IntlProvider>
      </QueryClientProvider>,
      { wrapper: null },
    );

    // The filter shows its active state
    const checkbox = getByLabelText((content) => content.startsWith('Human name'));
    expect(checkbox).not.toHaveAttribute('checked');
    expect(checkbox).toHaveAttribute('disabled');
    expect(checkbox.parentElement).toHaveClass('search-filter-value-parent__self__label--disabled');
  });
  it('shows the parent filter value itself as active when it is in the search params', () => {
    const { getByLabelText } = render(
      <QueryClientProvider client={createTestQueryClient()}>
        <IntlProvider locale="en">
          <HistoryContext.Provider
            value={makeHistoryOf({
              filter_name: 'P-00040005',
              limit: '999',
              offset: '0',
            })}
          >
            <SearchFilterValueParent
              filter={{
                base_path: '0009',
                has_more_values: false,
                human_name: 'Filter name',
                is_autocompletable: true,
                is_searchable: true,
                name: 'filter_name',
                position: 0,
                values: [],
              }}
              value={{
                count: 218,
                human_name: 'Human name',
                key: 'P-00040005',
              }}
            />
          </HistoryContext.Provider>
        </IntlProvider>
      </QueryClientProvider>,
      { wrapper: null },
    );

    const checkbox = getByLabelText((content) => content.startsWith('Human name'));
    expect(checkbox!.parentElement).toHaveTextContent('(218)'); // label that contains checkbox
    expect(checkbox).toHaveAttribute('checked');
    expect(checkbox!.parentElement!.parentElement).toHaveClass('active'); // parent self filter
  });

  it('dispatches a FILTER_ADD action on filter click if it was not active', () => {
    const { getByLabelText } = render(
      <QueryClientProvider client={createTestQueryClient()}>
        <IntlProvider locale="en">
          <HistoryContext.Provider value={makeHistoryOf({ limit: '999', offset: '0' })}>
            <SearchFilterValueParent
              filter={{
                base_path: '0009',
                has_more_values: false,
                human_name: 'Filter name',
                is_autocompletable: true,
                is_searchable: true,
                name: 'filter_name',
                position: 0,
                values: [],
              }}
              value={{
                count: 217,
                human_name: 'Human name',
                key: 'P-00040005',
              }}
            />
          </HistoryContext.Provider>
        </IntlProvider>
      </QueryClientProvider>,
      { wrapper: null },
    );

    fireEvent.click(getByLabelText((content) => content.startsWith('Human name')));
    expect(historyPushState).toHaveBeenCalledWith(
      {
        name: 'courseSearch',
        data: {
          lastDispatchActions: expect.any(Array),
          params: { filter_name: ['P-00040005'], limit: '999', offset: '0' },
        },
      },
      '',
      '/?filter_name=P-00040005&limit=999&offset=0',
    );
  });

  it('dispatches a FILTER_REMOVE action on filter click if it was active', () => {
    const { getByLabelText } = render(
      <QueryClientProvider client={createTestQueryClient()}>
        <IntlProvider locale="en">
          <HistoryContext.Provider
            value={makeHistoryOf({
              filter_name: 'P-00040005',
              limit: '999',
              offset: '0',
            })}
          >
            <SearchFilterValueParent
              filter={{
                base_path: '0009',
                has_more_values: false,
                human_name: 'Filter name',
                is_autocompletable: true,
                is_searchable: true,
                name: 'filter_name',
                position: 0,
                values: [],
              }}
              value={{
                count: 217,
                human_name: 'Human name',
                key: 'P-00040005',
              }}
            />
          </HistoryContext.Provider>
        </IntlProvider>
      </QueryClientProvider>,
      { wrapper: null },
    );

    fireEvent.click(getByLabelText((content) => content.startsWith('Human name')));
    expect(historyPushState).toHaveBeenCalledWith(
      {
        name: 'courseSearch',
        data: {
          lastDispatchActions: expect.any(Array),
          params: { filter_name: undefined, limit: '999', offset: '0' },
        },
      },
      '',
      '/?limit=999&offset=0',
    );
  });
});

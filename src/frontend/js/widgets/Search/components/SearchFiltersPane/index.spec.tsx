import { fireEvent, render } from '@testing-library/react';
import queryString from 'query-string';
import { IntlProvider } from 'react-intl';

import { History, HistoryContext } from 'hooks/useHistory';
import { SearchFiltersPane } from '.';

jest.mock('../SearchFilterGroup', () => ({
  SearchFilterGroup: ({ filter }: any) => (
    <span data-testid="filter">{`Received filter title: ${filter.human_name}`}</span>
  ),
}));

describe('widgets/Search/components/SearchFiltersPane', () => {
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

  it('renders all our search filter groups', () => {
    const shuffledNames = ['Categories', 'Organizations', 'Persons'].sort(
      () => Math.random() - 0.5,
    );

    const { getByText, getAllByTestId } = render(
      <IntlProvider locale="en">
        <HistoryContext.Provider value={makeHistoryOf({ limit: '999', offset: '0' })}>
          <SearchFiltersPane
            filters={{
              categories: {
                base_path: '0001',
                has_more_values: false,
                human_name: 'Categories',
                is_autocompletable: true,
                is_searchable: true,
                name: 'categories',
                position: shuffledNames.indexOf('Categories'),
                values: [],
              },
              organizations: {
                base_path: '0002',
                has_more_values: false,
                human_name: 'Organizations',
                is_autocompletable: true,
                is_searchable: true,
                name: 'organizations',
                position: shuffledNames.indexOf('Organizations'),
                values: [],
              },
              persons: {
                base_path: '0003',
                has_more_values: false,
                human_name: 'Persons',
                is_autocompletable: true,
                is_searchable: true,
                name: 'persons',
                position: shuffledNames.indexOf('Persons'),
                values: [],
              },
            }}
          />
        </HistoryContext.Provider>
      </IntlProvider>,
    );

    // The pane's title is shown along with filter groups in the order defined by their position
    const items = getAllByTestId('filter');
    expect(items.length).toEqual(3);
    items.forEach((element, index) => {
      expect(element.textContent).toContain(shuffledNames[index]);
    });

    expect(getByText('Clear 0 active filters')).toHaveClass('search-filters-pane__clear--hidden');
  });

  it('still renders with its title when it is not passed anything', () => {
    const { getByText } = render(
      <IntlProvider locale="en">
        <HistoryContext.Provider value={makeHistoryOf({ limit: '999', offset: '0' })}>
          <SearchFiltersPane filters={null} />
        </HistoryContext.Provider>
      </IntlProvider>,
    );
    getByText('Filter courses');
  });

  it('shows a button to remove all active filters when there are active filters', () => {
    const { getByText, getByRole } = render(
      <IntlProvider locale="en">
        <HistoryContext.Provider
          value={makeHistoryOf({
            limit: '14',
            offset: '28',
            organizations: 'L-00010023',
            categories: ['12'],
          })}
        >
          <SearchFiltersPane
            filters={{
              categories: {
                base_path: '0001',
                has_more_values: false,
                human_name: 'Categories',
                is_autocompletable: true,
                is_searchable: true,
                name: 'categories',
                position: 0,
                values: [
                  {
                    count: 3,
                    human_name: 'Dummy category',
                    key: '12',
                  },
                ],
              },
              organizations: {
                base_path: '0002',
                has_more_values: false,
                human_name: 'Organizations',
                is_autocompletable: true,
                is_searchable: true,
                name: 'organizations',
                position: 1,
                values: [
                  {
                    count: 2,
                    human_name: 'Dummy organization',
                    key: 'L-00010023',
                  },
                ],
              },
            }}
          />
        </HistoryContext.Provider>
      </IntlProvider>,
    );

    const clearButton = getByText('Clear 2 active filters');
    expect(getByText('Clear 2 active filters').parentElement).not.toHaveClass(
      'search-filters-pane__clear--hidden',
    );

    // we want additional hidden text for screen reader users
    getByRole('button', {
      name: 'Clear 2 active filters ("Dummy category", "Dummy organization")',
    });

    fireEvent.click(clearButton);
    expect(historyPushState).toHaveBeenCalledWith(
      {
        name: 'courseSearch',
        data: {
          lastDispatchActions: expect.any(Array),
          params: { limit: '14', offset: '0' },
        },
      },
      '',
      '/?limit=14&offset=0',
    );
  });
});

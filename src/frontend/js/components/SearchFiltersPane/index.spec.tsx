import 'testSetup';

import { fireEvent, render } from '@testing-library/react';
import { stringify } from 'query-string';
import React from 'react';
import { IntlProvider } from 'react-intl';

import { History, HistoryContext } from 'data/useHistory';
import { SearchFiltersPane } from '.';

jest.mock('components/SearchFilterGroup', () => ({
  SearchFilterGroup: ({ filter }: any) => (
    <span>{`Received filter title: ${filter.human_name}`}</span>
  ),
}));

describe('components/SearchFiltersPane', () => {
  const historyPushState = jest.fn();
  const historyReplaceState = jest.fn();
  const makeHistoryOf: (params: any) => History = params => [
    { state: params, title: '', url: `/search?${stringify(params)}` },
    historyPushState,
    historyReplaceState,
  ];

  it('renders all our search filter groups', () => {
    const { getByText } = render(
      <IntlProvider locale="en">
        <HistoryContext.Provider
          value={makeHistoryOf({ limit: '999', offset: '0' })}
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
                values: [],
              },
              organizations: {
                base_path: '0002',
                has_more_values: false,
                human_name: 'Organizations',
                is_autocompletable: true,
                is_searchable: true,
                name: 'organizations',
                position: 1,
                values: [],
              },
            }}
          />
        </HistoryContext.Provider>
      </IntlProvider>,
    );

    // The pane's title is shown along with the filter groups
    getByText('Filter courses');
    getByText('Received filter title: Categories');
    getByText('Received filter title: Organizations');
    expect(getByText('Clear 0 active filters')).toHaveClass(
      'search-filters-pane__clear--hidden',
    );
  });

  it('still renders with its title when it is not passed anything', () => {
    const { getByText } = render(
      <IntlProvider locale="en">
        <HistoryContext.Provider
          value={makeHistoryOf({ limit: '999', offset: '0' })}
        >
          <SearchFiltersPane filters={null} />
        </HistoryContext.Provider>
      </IntlProvider>,
    );
    getByText('Filter courses');
  });

  it('shows a button to remove all active filters when there are active filters', () => {
    const { getByText } = render(
      <IntlProvider locale="en">
        <HistoryContext.Provider
          value={makeHistoryOf({
            limit: '14',
            offset: '28',
            organizations: 'L-00010023',
            query: 'some query',
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
                values: [],
              },
              organizations: {
                base_path: '0002',
                has_more_values: false,
                human_name: 'Organizations',
                is_autocompletable: true,
                is_searchable: true,
                name: 'organizations',
                position: 1,
                values: [],
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

    fireEvent.click(clearButton);
    expect(historyPushState).toHaveBeenCalledWith(
      { limit: '14', offset: '0' },
      '',
      '/?limit=14&offset=0',
    );
  });
});

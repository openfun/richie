import { render, screen } from '@testing-library/react';
import queryString from 'query-string';
import { IntlProvider } from 'react-intl';

import { History, HistoryContext } from 'hooks/useHistory';
import { SearchFilterGroup } from '.';

jest.mock('../SearchFilterValueLeaf', () => ({
  SearchFilterValueLeaf: ({ value }: any) => (
    <span>{`Received leaf: filter - ${value.human_name}`}</span>
  ),
}));

jest.mock('../SearchFilterValueParent', () => ({
  SearchFilterValueParent: ({ value }: any) => (
    <span>{`Received parent: filter - ${value.human_name}`}</span>
  ),
}));

describe('widgets/Search/components/SearchFilterGroup', () => {
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

  const filter = {
    base_path: '0001',
    has_more_values: true,
    human_name: 'Organizations',
    is_autocompletable: true,
    is_searchable: true,
    name: 'organizations',
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

  beforeEach(jest.resetAllMocks);

  it('renders the name of the filter with the values as SearchFilters', () => {
    render(
      <IntlProvider locale="en">
        <HistoryContext.Provider value={makeHistoryOf({ limit: '20', offset: '0' })}>
          <SearchFilterGroup filter={filter} />
        </HistoryContext.Provider>
      </IntlProvider>,
    );
    // The filter group title and all filters are shown
    screen.getByRole('group', { name: 'Organizations' });
    screen.getByText('Received parent: filter - Value One');
    screen.getByText('Received leaf: filter - Value Two');
    screen.getByRole('button', { name: 'More options (Organizations)' });
  });

  it('does not render the "More options" button & modal if the filter is not searchable', () => {
    render(
      <IntlProvider locale="en">
        <HistoryContext.Provider value={makeHistoryOf({ limit: '20', offset: '0' })}>
          <SearchFilterGroup filter={{ ...filter, is_searchable: false }} />
        </HistoryContext.Provider>
      </IntlProvider>,
    );

    expect(screen.queryByRole('button', { name: 'More options' })).toEqual(null);
  });

  it('does not render the "More options" button & modal if there are no more values to find', () => {
    render(
      <IntlProvider locale="en">
        <HistoryContext.Provider value={makeHistoryOf({ limit: '20', offset: '0' })}>
          <SearchFilterGroup filter={{ ...filter, has_more_values: false }} />
        </HistoryContext.Provider>
      </IntlProvider>,
    );

    expect(screen.queryByRole('button', { name: 'More options' })).toEqual(null);
  });
});

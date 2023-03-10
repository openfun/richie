import { fireEvent, render } from '@testing-library/react';
import queryString from 'query-string';
import { IntlProvider } from 'react-intl';

import { History, HistoryContext } from 'hooks/useHistory';
import { SearchFilterValueLeaf } from '.';

describe('widgets/Search/components/SearchFilterValueLeaf', () => {
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

  beforeEach(jest.resetAllMocks);

  it('renders the name of the filter value', () => {
    const { getByLabelText } = render(
      <IntlProvider locale="en">
        <HistoryContext.Provider value={makeHistoryOf({ limit: '999', offset: '0' })}>
          <SearchFilterValueLeaf
            filter={{
              base_path: null,
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
              key: '42',
            }}
          />
        </HistoryContext.Provider>
      </IntlProvider>,
    );

    // The filter value is displayed with its facet count
    const checkbox = getByLabelText((content) => content.includes('Human name'));
    expect(checkbox.parentElement).toHaveTextContent('(217)');
    // The filter is not currently active
    expect(checkbox).not.toHaveAttribute('checked');
    expect(checkbox.parentElement).not.toHaveClass('active');
  });

  it('shows the filter value as active when it is in the search params', () => {
    const { getByLabelText } = render(
      <IntlProvider locale="en">
        <HistoryContext.Provider
          value={makeHistoryOf({
            filter_name: '42',
            limit: '999',
            offset: '0',
          })}
        >
          <SearchFilterValueLeaf
            filter={{
              base_path: null,
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
              key: '42',
            }}
          />
        </HistoryContext.Provider>
      </IntlProvider>,
    );

    // The filter shows its active state
    const checkbox = getByLabelText((content) => content.includes('Human name'));
    expect(checkbox).toHaveAttribute('checked');
    expect(checkbox.parentElement).toHaveClass('active'); // label that contains checkbox
  });

  it('disables the value when its count is 0', () => {
    const { getByLabelText } = render(
      <IntlProvider locale="en">
        <HistoryContext.Provider value={makeHistoryOf({ limit: '999', offset: '0' })}>
          <SearchFilterValueLeaf
            filter={{
              base_path: null,
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
              key: '42',
            }}
          />
        </HistoryContext.Provider>
      </IntlProvider>,
    );

    // The filter shows its active state
    const checkbox = getByLabelText((content) => content.includes('Human name'));
    expect(checkbox).not.toHaveAttribute('checked');
    expect(checkbox).toHaveAttribute('disabled');
    expect(checkbox.parentElement).toHaveClass('search-filter-value-leaf--disabled');
  });

  it('dispatches a FILTER_ADD action on filter click if it was not active', () => {
    const { getByLabelText } = render(
      <IntlProvider locale="en">
        <HistoryContext.Provider value={makeHistoryOf({ limit: '999', offset: '0' })}>
          <SearchFilterValueLeaf
            filter={{
              base_path: null,
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
              key: '43',
            }}
          />
        </HistoryContext.Provider>
      </IntlProvider>,
    );

    fireEvent.click(getByLabelText((content) => content.includes('Human name')));
    expect(historyPushState).toHaveBeenCalledWith(
      {
        name: 'courseSearch',
        data: {
          lastDispatchActions: expect.any(Array),
          params: { filter_name: ['43'], limit: '999', offset: '0' },
        },
      },
      '',
      '/?filter_name=43&limit=999&offset=0',
    );
  });

  it('dispatches a FILTER_REMOVE action on filter click if it was active', () => {
    const { getByLabelText } = render(
      <IntlProvider locale="en">
        <HistoryContext.Provider
          value={makeHistoryOf({
            filter_name: '44',
            limit: '999',
            offset: '0',
          })}
        >
          <SearchFilterValueLeaf
            filter={{
              base_path: null,
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
              key: '44',
            }}
          />
        </HistoryContext.Provider>
      </IntlProvider>,
    );

    fireEvent.click(getByLabelText((content) => content.includes('Human name')));
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

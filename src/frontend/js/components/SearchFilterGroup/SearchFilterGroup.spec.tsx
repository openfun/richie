import '../../testSetup';

import React from 'react';
import { cleanup, render } from 'react-testing-library';

import { CourseSearchParamsContext } from '../../data/useCourseSearchParams/useCourseSearchParams';
import { SearchFilterGroup } from './SearchFilterGroup';

jest.mock('../SearchFilter/SearchFilter', () => ({
  SearchFilter: ({ filter, isActive }: any) => (
    <span data-testid="search-filter">{`Received: ${
      isActive ? 'active' : 'non-active'
    } filter - ${filter.human_name}`}</span>
  ),
}));

describe('components/SearchFilterGroup', () => {
  beforeEach(jest.resetAllMocks);
  afterEach(cleanup);

  it('renders the name of the filter with the values as SearchFilters', () => {
    const { getByText } = render(
      <CourseSearchParamsContext.Provider
        value={[{ limit: '999', offset: '0' }, jest.fn()]}
      >
        <SearchFilterGroup
          filter={{
            human_name: 'Organizations',
            name: 'organizations',
            values: [
              {
                count: 4,
                human_name: 'Value One',
                key: 'value-1',
              },
              {
                count: 7,
                human_name: 'Value Two',
                key: 'value-2',
              },
            ],
          }}
        />
      </CourseSearchParamsContext.Provider>,
    );

    // The filter group title and all filters are shown
    getByText('Organizations');
    getByText('Received: non-active filter - Value One');
    getByText('Received: non-active filter - Value Two');
  });

  it('renders any active filter values at the top of the list', () => {
    const { getAllByTestId, getByText } = render(
      <CourseSearchParamsContext.Provider
        value={[
          { example_filter: 'value-2', limit: '999', offset: '0' },
          jest.fn(),
        ]}
      >
        <SearchFilterGroup
          filter={{
            human_name: 'Example filter',
            name: 'example_filter',
            values: [
              {
                count: 4,
                human_name: 'Value One',
                key: 'value-1',
              },
              {
                count: 6,
                human_name: 'Value Two',
                key: 'value-2',
              },
              {
                count: 5,
                human_name: 'Value Three',
                key: 'value-3',
              },
            ],
          }}
        />
      </CourseSearchParamsContext.Provider>,
    );

    const searchFilters = getAllByTestId('search-filter');
    // All the passed in filters are shown
    expect(searchFilters.length).toEqual(3);
    // The active filter is first in the list
    expect(searchFilters[0]).toHaveTextContent(
      'Received: active filter - Value Two',
    );
    expect(searchFilters[1]).toHaveTextContent(
      'Received: non-active filter - Value One',
    );
    expect(searchFilters[2]).toHaveTextContent(
      'Received: non-active filter - Value Three',
    );
  });
});

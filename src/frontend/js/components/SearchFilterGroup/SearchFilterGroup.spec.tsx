import '../../testSetup';

import React from 'react';
import { cleanup, render } from 'react-testing-library';

import { CourseSearchParamsContext } from '../../data/useCourseSearchParams/useCourseSearchParams';
import { SearchFilterGroup } from './SearchFilterGroup';

jest.mock('../SearchFilterValueLeaf/SearchFilterValueLeaf', () => ({
  SearchFilterValueLeaf: ({ value }: any) => (
    <span data-testid="search-filter">{`Received: filter - ${
      value.human_name
    }`}</span>
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
    getByText('Received: filter - Value One');
    getByText('Received: filter - Value Two');
  });
});

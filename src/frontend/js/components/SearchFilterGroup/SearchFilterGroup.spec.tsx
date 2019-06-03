import '../../testSetup';

import { cleanup, render } from '@testing-library/react';
import React from 'react';

import { CourseSearchParamsContext } from '../../data/useCourseSearchParams/useCourseSearchParams';
import { SearchFilterGroup } from './SearchFilterGroup';

jest.mock('../SearchFilterValueLeaf/SearchFilterValueLeaf', () => ({
  SearchFilterValueLeaf: ({ value }: any) => (
    <span>{`Received leaf: filter - ${value.human_name}`}</span>
  ),
}));

jest.mock('../SearchFilterValueParent/SearchFilterValueParent', () => ({
  SearchFilterValueParent: ({ value }: any) => (
    <span>{`Received parent: filter - ${value.human_name}`}</span>
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
            base_path: '0001',
            human_name: 'Organizations',
            is_autocompletable: true,
            name: 'organizations',
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
          }}
        />
      </CourseSearchParamsContext.Provider>,
    );
    // The filter group title and all filters are shown
    getByText('Organizations');
    getByText('Received parent: filter - Value One');
    getByText('Received leaf: filter - Value Two');
  });
});

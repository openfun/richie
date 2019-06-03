import '../../testSetup';

import { cleanup, fireEvent, render } from '@testing-library/react';
import React from 'react';
import { IntlProvider } from 'react-intl';

import { CourseSearchParamsContext } from '../../data/useCourseSearchParams/useCourseSearchParams';
import { SearchFiltersPane } from './SearchFiltersPane';

jest.mock('../SearchFilterGroup/SearchFilterGroup', () => ({
  SearchFilterGroup: ({ filter }: any) => (
    <span>{`Received filter title: ${filter.human_name}`}</span>
  ),
}));

describe('components/SearchFiltersPane', () => {
  afterEach(cleanup);

  it('renders all our search filter groups', () => {
    const { getByText } = render(
      <IntlProvider locale="en">
        <CourseSearchParamsContext.Provider
          value={[{ limit: '999', offset: '0' }, jest.fn()]}
        >
          <SearchFiltersPane
            filters={{
              categories: {
                base_path: '0001',
                human_name: 'Categories',
                is_autocompletable: true,
                name: 'categories',
                values: [],
              },
              organizations: {
                base_path: '0002',
                human_name: 'Organizations',
                is_autocompletable: true,
                name: 'organizations',
                values: [],
              },
            }}
          />
        </CourseSearchParamsContext.Provider>
      </IntlProvider>,
    );

    // The pane's title is shown along with the filter groups
    getByText('Filter courses');
    getByText('Received filter title: Categories');
    getByText('Received filter title: Organizations');
    expect(getByText('Clear 0 active filters').parentElement).toHaveClass(
      'search-filters-pane__clear--hidden',
    );
  });

  it('still renders with its title when it is not passed anything', () => {
    const { getByText } = render(
      <IntlProvider locale="en">
        <CourseSearchParamsContext.Provider
          value={[{ limit: '999', offset: '0' }, jest.fn()]}
        >
          <SearchFiltersPane filters={null} />
        </CourseSearchParamsContext.Provider>
      </IntlProvider>,
    );
    getByText('Filter courses');
  });

  it('shows a button to remove all active filters when there are active filters', () => {
    const mockDispatchCourseSearchParamsUpdate = jest.fn();
    const { getByText } = render(
      <IntlProvider locale="en">
        <CourseSearchParamsContext.Provider
          value={[
            {
              limit: '14',
              offset: '28',
              organizations: 'L-00010023',
              query: 'some query',
            },
            mockDispatchCourseSearchParamsUpdate,
          ]}
        >
          <SearchFiltersPane
            filters={{
              categories: {
                base_path: '0001',
                human_name: 'Categories',
                is_autocompletable: true,
                name: 'categories',
                values: [],
              },
              organizations: {
                base_path: '0002',
                human_name: 'Organizations',
                is_autocompletable: true,
                name: 'organizations',
                values: [],
              },
            }}
          />
        </CourseSearchParamsContext.Provider>
      </IntlProvider>,
    );

    const clearButton = getByText('Clear 2 active filters');
    expect(getByText('Clear 2 active filters').parentElement).not.toHaveClass(
      'search-filters-pane__clear--hidden',
    );

    fireEvent.click(clearButton);
    expect(mockDispatchCourseSearchParamsUpdate).toHaveBeenCalledWith({
      type: 'FILTER_RESET',
    });
  });
});

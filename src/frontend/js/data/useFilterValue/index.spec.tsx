import { render } from '@testing-library/react';
import React from 'react';

import { CourseSearchParamsContext } from 'data/useCourseSearchParams';
import { FilterDefinition, FilterValue } from 'types/filters';
import { useFilterValue } from '.';

describe('data/useFilterValue', () => {
  // Build a helper component with an out-of-scope function to let us reach our Hook from
  // our test cases.
  let getLatestHookValues: any;
  const TestComponent = ({
    filter,
    value,
  }: {
    filter: FilterDefinition;
    value: FilterValue;
  }) => {
    const hookValues = useFilterValue(filter, value);
    getLatestHookValues = () => hookValues;
    return <div />;
  };

  beforeEach(jest.resetAllMocks);

  it('returns the active [true] status of the filter value and a function to toggle it', () => {
    const mockDispatchCourseSearchParamsAction = jest.fn();
    render(
      <CourseSearchParamsContext.Provider
        value={[
          { limit: '999', offset: '0' },
          mockDispatchCourseSearchParamsAction,
        ]}
      >
        <TestComponent
          filter={{
            base_path: '0003',
            has_more_values: false,
            human_name: 'Organizations',
            is_autocompletable: false,
            is_searchable: false,
            name: 'organizations',
            values: [],
          }}
          value={{
            count: 13,
            human_name: 'Université Paris 14',
            key: '87',
          }}
        />
      </CourseSearchParamsContext.Provider>,
    );
    const [isActive, toggle] = getLatestHookValues();
    expect(isActive).toEqual(false);
    toggle();
    expect(mockDispatchCourseSearchParamsAction).toHaveBeenCalledWith({
      filter: {
        base_path: '0003',
        has_more_values: false,
        human_name: 'Organizations',
        is_autocompletable: false,
        is_searchable: false,
        name: 'organizations',
        values: [],
      },
      payload: '87',
      type: 'FILTER_ADD',
    });
  });

  it('returns the active [false] status of the filter value and a function to toggle it', () => {
    const mockDispatchCourseSearchParamsAction = jest.fn();
    render(
      <CourseSearchParamsContext.Provider
        value={[
          { limit: '999', offset: '0', organizations: ['87'] },
          mockDispatchCourseSearchParamsAction,
        ]}
      >
        <TestComponent
          filter={{
            base_path: '0003',
            has_more_values: false,
            human_name: 'Organizations',
            is_autocompletable: true,
            is_searchable: true,
            name: 'organizations',
            values: [],
          }}
          value={{
            count: 13,
            human_name: 'Université Paris 14',
            key: '87',
          }}
        />
      </CourseSearchParamsContext.Provider>,
    );
    const [isActive, toggle] = getLatestHookValues();
    expect(isActive).toEqual(true);
    toggle();
    expect(mockDispatchCourseSearchParamsAction).toHaveBeenCalledWith({
      filter: {
        base_path: '0003',
        has_more_values: false,
        human_name: 'Organizations',
        is_autocompletable: true,
        is_searchable: true,
        name: 'organizations',
        values: [],
      },
      payload: '87',
      type: 'FILTER_REMOVE',
    });
  });
});

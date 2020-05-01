import { render } from '@testing-library/react';
import { stringify } from 'query-string';
import React from 'react';

import { CourseSearchParamsAction } from 'data/useCourseSearchParams';
import { History, HistoryContext } from 'data/useHistory';
import { FacetedFilterDefinition, FilterValue } from 'types/filters';
import { useFilterValue } from '.';

describe('data/useFilterValue', () => {
  const historyPushState = jest.fn();
  const historyReplaceState = jest.fn();
  const makeHistoryOf: (params: any) => History = (params) => [
    {
      state: { name: 'courseSearch', data: { params } },
      title: '',
      url: `/search?${stringify(params)}`,
    },
    historyPushState,
    historyReplaceState,
  ];

  // Build a helper component with an out-of-scope function to let us reach our Hook from
  // our test cases.
  let getLatestHookValues: any;
  const TestComponent = ({
    filter,
    value,
  }: {
    filter: FacetedFilterDefinition;
    value: FilterValue;
  }) => {
    const hookValues = useFilterValue(filter, value);
    getLatestHookValues = () => hookValues;
    return <div />;
  };

  beforeEach(jest.resetAllMocks);

  it('returns the active [false] status of the filter value and a function to toggle it', () => {
    render(
      <HistoryContext.Provider
        value={makeHistoryOf({ limit: '999', offset: '0' })}
      >
        <TestComponent
          filter={{
            base_path: '0003',
            has_more_values: false,
            human_name: 'Organizations',
            is_autocompletable: false,
            is_searchable: false,
            name: 'organizations',
            position: 0,
            values: [],
          }}
          value={{
            count: 13,
            human_name: 'Université Paris 14',
            key: '87',
          }}
        />
      </HistoryContext.Provider>,
    );
    const [isActive, toggle] = getLatestHookValues();
    expect(isActive).toEqual(false);
    toggle();
    expect(historyPushState).toHaveBeenCalledWith(
      {
        name: 'courseSearch',
        data: {
          lastDispatchActions: [
            {
              filter: {
                base_path: '0003',
                has_more_values: false,
                human_name: 'Organizations',
                is_autocompletable: false,
                is_searchable: false,
                name: 'organizations',
                position: 0,
                values: [],
              },
              payload: '87',
              type: CourseSearchParamsAction.filterAdd,
            },
          ],
          params: { limit: '999', offset: '0', organizations: ['87'] },
        },
      },
      '',
      '/?limit=999&offset=0&organizations=87',
    );
  });

  it('returns the active [true] status of the filter value and a function to toggle it', () => {
    render(
      <HistoryContext.Provider
        value={makeHistoryOf({
          limit: '999',
          offset: '0',
          organizations: ['87'],
        })}
      >
        <TestComponent
          filter={{
            base_path: '0003',
            has_more_values: false,
            human_name: 'Organizations',
            is_autocompletable: true,
            is_searchable: true,
            name: 'organizations',
            position: 0,
            values: [],
          }}
          value={{
            count: 13,
            human_name: 'Université Paris 14',
            key: '87',
          }}
        />
      </HistoryContext.Provider>,
    );
    const [isActive, toggle] = getLatestHookValues();
    expect(isActive).toEqual(true);
    toggle();
    expect(historyPushState).toHaveBeenCalledWith(
      {
        name: 'courseSearch',
        data: {
          lastDispatchActions: [
            {
              filter: {
                base_path: '0003',
                has_more_values: false,
                human_name: 'Organizations',
                is_autocompletable: true,
                is_searchable: true,
                name: 'organizations',
                position: 0,
                values: [],
              },
              payload: '87',
              type: CourseSearchParamsAction.filterRemove,
            },
          ],
          params: { limit: '999', offset: '0', organizations: undefined },
        },
      },
      '',
      '/?limit=999&offset=0',
    );
  });
});

import { stringify } from 'query-string';
import { PropsWithChildren } from 'react';

import { CourseSearchParamsAction } from 'data/useCourseSearchParams';
import { renderHook } from '@testing-library/react-hooks';
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
  const wrapper = ({ history, children }: PropsWithChildren<{ history: History }>) => (
    <HistoryContext.Provider value={history}>{children}</HistoryContext.Provider>
  );

  beforeEach(jest.resetAllMocks);

  it('returns the active [false] status of the filter value and a function to toggle it', () => {
    const props: [FacetedFilterDefinition, FilterValue] = [
      // filter: FacetedFilterDefinition
      {
        base_path: '0003',
        has_more_values: false,
        human_name: 'Organizations',
        is_autocompletable: false,
        is_searchable: false,
        name: 'organizations',
        position: 0,
        values: [],
      },
      // value: FilterValue
      {
        count: 13,
        human_name: 'Université Paris 14',
        key: '87',
      },
    ];
    const { result } = renderHook(() => useFilterValue(...props), {
      wrapper,
      initialProps: { history: makeHistoryOf({ limit: '999', offset: '0' }) },
    });

    const [isActive, toggle] = result.current;
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
    const props: [FacetedFilterDefinition, FilterValue] = [
      // filter: FacetedFilterDefinition
      {
        base_path: '0003',
        has_more_values: false,
        human_name: 'Organizations',
        is_autocompletable: true,
        is_searchable: true,
        name: 'organizations',
        position: 0,
        values: [],
      },
      // value: FilterValue
      {
        count: 13,
        human_name: 'Université Paris 14',
        key: '87',
      },
    ];
    const { result } = renderHook(() => useFilterValue(...props), {
      wrapper,
      initialProps: {
        history: makeHistoryOf({ limit: '999', offset: '0', organizations: ['87'] }),
      },
    });

    const [isActive, toggle] = result.current;
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

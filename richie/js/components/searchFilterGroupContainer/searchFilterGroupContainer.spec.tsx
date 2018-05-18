import { stringify } from 'query-string';

import { FilterDefinitionState } from '../../data/filterDefinitions/reducer';
import { ResourceListState } from '../../data/genericReducers/resourceList/resourceList';
import { RootState } from '../../data/rootReducer';
import Course from '../../types/Course';
import * as filterFromStateGetter from '../../utils/filters/getFilterFromState';
import * as filterUpdater from '../../utils/filters/updateFilter';
import { mapStateToProps, mergeProps } from './searchFilterGroupContainer';

describe('components/searchFilterGroupContainer/mergeProps', () => {
  const exampleFilter = {
    humanName: 'Organizations',
    machineName: 'organizations' as 'organizations',
    values: [
      { count: 3, humanName: 'Organization #31', primaryKey: '31' },
      { count: 5, humanName: 'Organization #41', primaryKey: '41' },
    ],
  };

  beforeEach(() => {
    spyOn(filterUpdater, 'updateFilter').and.callFake(
      (...params: any[]) => params,
    );
    spyOn(filterFromStateGetter, 'getFilterFromState').and.returnValue(
      exampleFilter,
    );
  });

  it('returns the relevant filter, its current value & partially applied update helpers', () => {
    const dispatch: any = () => undefined;
    const props = { machineName: 'organizations' as 'organizations' };
    const state = {
      filterDefinitions: {} as FilterDefinitionState,
      resources: {
        courses: {
          byId: {},
          currentQuery: {
            params: { limit: 17, offset: 7, organizations: [12, 24] },
          } as ResourceListState<Course>,
        },
        organizations: {},
      },
    } as RootState;

    // We're not interested in the internal implementation of mapStateToProps, only test the final output
    const { addFilter, currentValue, filter, removeFilter } = mergeProps(
      mapStateToProps(state, props),
      { dispatch },
      props,
    );

    expect(currentValue).toEqual([12, 24]);
    expect(filter).toEqual(exampleFilter);
    expect(addFilter()).toEqual([dispatch, 'add', filter]);
    expect(removeFilter()).toEqual([dispatch, 'remove', filter]);
  });
});

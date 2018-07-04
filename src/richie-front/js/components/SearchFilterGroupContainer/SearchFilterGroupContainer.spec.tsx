import { FilterDefinitionState } from '../../data/filterDefinitions/reducer';
import { ResourceListState } from '../../data/genericReducers/resourceList/resourceList';
import { RootState } from '../../data/rootReducer';
import { Course } from '../../types/Course';
import * as filterFromStateGetter from '../../utils/filters/getFilterFromState';
import * as filterUpdater from '../../utils/filters/updateFilter';
import { mapStateToProps, mergeProps } from './SearchFilterGroupContainer';

describe('components/SearchFilterGroupContainer/mergeProps', () => {
  const exampleFilter = {
    humanName: { defaultMessage: 'Organizations', id: 'organizations' },
    machineName: 'organizations' as 'organizations',
    values: [
      {
        count: 3,
        humanName: { defaultMessage: 'Organization #31', id: 'org31' },
        primaryKey: '31',
      },
      {
        count: 5,
        humanName: { defaultMessage: 'Organization #41', id: 'org41' },
        primaryKey: '41',
      },
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
        organizations: { byId: {} },
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
    expect(addFilter()).toEqual([
      dispatch,
      { limit: 17, offset: 7, organizations: [12, 24] },
      'add',
      filter,
    ]);
    expect(removeFilter()).toEqual([
      dispatch,
      { limit: 17, offset: 7, organizations: [12, 24] },
      'remove',
      filter,
    ]);
  });
});

import { FilterDefinitionState } from '../../data/filterDefinitions/reducer';
import * as filterUpdater from '../../utils/filters/updateFilter';
import { mapStateToProps, mergeProps } from './SearchSuggestFieldContainer';

describe('components/SearchSuggestFieldContainer/mergeProps', () => {
  beforeEach(() => {
    spyOn(filterUpdater, 'updateFilter');
  });

  it('builds props with an addFilter function that calls updateFilter', () => {
    const dispatch = jasmine.createSpy('dispatch');
    const state = {
      filterDefinitions: {
        organizations: {
          humanName: { defaultMessage: 'Organizations', id: 'organizations' },
          machineName: 'organizations',
        },
      } as FilterDefinitionState,
      resources: {
        courses: {
          byId: {},
          currentQuery: {
            facets: {},
            items: { 0: 42 },
            params: { limit: 20, offset: 0 },
            total_count: 0,
          },
        },
      },
    };
    const { addFilter } = mergeProps(mapStateToProps(state), { dispatch });

    addFilter('organizations', '84');

    expect(filterUpdater.updateFilter).toHaveBeenCalledWith(
      dispatch,
      { limit: 20, offset: 0 },
      'add',
      {
        humanName: { defaultMessage: 'Organizations', id: 'organizations' },
        machineName: 'organizations',
      },
      '84',
    );
  });
});

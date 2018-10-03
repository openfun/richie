import { FilterDefinitionState } from '../../data/filterDefinitions/reducer';
import { updateFilter } from '../../utils/filters/updateFilter';
import { mapStateToProps, mergeProps } from './SearchSuggestFieldContainer';

const mockUpdateFilter: jest.Mock<typeof updateFilter> = updateFilter as any;
jest.mock('../../utils/filters/updateFilter');

describe('components/SearchSuggestFieldContainer/mergeProps', () => {
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

    expect(mockUpdateFilter).toHaveBeenCalledWith(
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

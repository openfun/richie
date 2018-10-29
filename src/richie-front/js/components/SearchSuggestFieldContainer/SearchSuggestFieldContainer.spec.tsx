import { FilterDefinitionState } from '../../data/filterDefinitions/reducer';
import { updateFilter } from '../../utils/filters/updateFilter';
import { mapStateToProps, mergeProps } from './SearchSuggestFieldContainer';

const mockUpdateFilter: jest.Mock<typeof updateFilter> = updateFilter as any;
jest.mock('../../utils/filters/updateFilter');

describe('components/SearchSuggestFieldContainer/mergeProps', () => {
  const dispatch = jest.fn();
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

  beforeEach(dispatch.mockClear);

  it('builds props with an addFilter function that calls updateFilter', () => {
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

  it('builds props with a fullTextSearch function that updates search params', () => {
    const { fullTextSearch } = mergeProps(mapStateToProps(state), { dispatch });
    fullTextSearch('some query');

    expect(dispatch).toHaveBeenCalledWith({
      params: { limit: 20, offset: 0, query: 'some query' },
      resourceName: 'courses',
      type: 'RESOURCE_LIST_GET',
    });
  });
});

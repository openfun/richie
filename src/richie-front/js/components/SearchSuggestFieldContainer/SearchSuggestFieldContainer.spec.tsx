import { FilterDefinitionState } from '../../data/filterDefinitions/reducer';
import { modelName } from '../../types/models';
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
        machineName: modelName.ORGANIZATIONS,
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
    addFilter(modelName.ORGANIZATIONS, '84');

    expect(mockUpdateFilter).toHaveBeenCalledWith(
      dispatch,
      { limit: 20, offset: 0 },
      'add',
      {
        humanName: { defaultMessage: 'Organizations', id: 'organizations' },
        machineName: modelName.ORGANIZATIONS,
      },
      '84',
    );
  });

  it('builds props with a fullTextSearch function that updates search params', () => {
    const { fullTextSearch } = mergeProps(mapStateToProps(state), { dispatch });
    fullTextSearch('some query');

    expect(dispatch).toHaveBeenCalledWith({
      params: { limit: 20, offset: 0, query: 'some query' },
      resourceName: modelName.COURSES,
      type: 'RESOURCE_LIST_GET',
    });
    expect(dispatch).toHaveBeenCalledWith({
      state: null,
      title: '',
      type: 'HISTORY_PUSH_STATE',
      url: '?limit=20&offset=0&query=some%20query',
    });
  });
});

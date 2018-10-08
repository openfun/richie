import { CoursesState } from '../../data/courses/reducer';
import { RootState } from '../../data/rootReducer';
import {
  FilterDefinition,
  FilterDefinitionWithValues,
} from '../../types/filters';
import { Organization } from '../../types/Organization';
import { getFilterFromState } from './getFilterFromState';

describe('utils/filters/getFilterFromState', () => {
  it('returns a FilterDefinition for a hardcoded filter group with facets', () => {
    const state = {
      filterDefinitions: {
        availability: {} as FilterDefinitionWithValues,
        language: {} as FilterDefinitionWithValues,
        new: {
          humanName: { defaultMessage: 'New courses', id: 'newCourses' },
          machineName: 'new' as 'new',
          values: [{ primaryKey: 'new', humanName: 'First session' }],
        },
        organizations: {} as FilterDefinition,
        subjects: {} as FilterDefinition,
      },
      resources: {
        courses: {
          byId: {},
          currentQuery: {
            facets: { new: { new: 3 } },
            items: {},
            params: { limit: 20, offset: 0 },
            total_count: 3,
          },
        },
      },
    } as RootState;
    expect(getFilterFromState(state, 'new')).toEqual({
      humanName: { defaultMessage: 'New courses', id: 'newCourses' },
      machineName: 'new',
      values: [{ primaryKey: 'new', humanName: 'First session', count: 3 }],
    });
  });

  it('returns a FilterDefinition for a hardcoded filter group without facet', () => {
    const state = {
      filterDefinitions: {
        availability: {} as FilterDefinitionWithValues,
        language: {} as FilterDefinitionWithValues,
        new: {
          humanName: { defaultMessage: 'New courses', id: 'newCourses' },
          machineName: 'new' as 'new',
          values: [{ primaryKey: 'new', humanName: 'First session' }],
        },
        organizations: {} as FilterDefinition,
        subjects: {} as FilterDefinition,
      },
      resources: {
        courses: {
          byId: {},
          currentQuery: {
            facets: {},
            items: {},
            params: { limit: 20, offset: 0 },
            total_count: 0,
          },
        },
      },
    } as RootState;
    expect(getFilterFromState(state, 'new')).toEqual({
      humanName: { defaultMessage: 'New courses', id: 'newCourses' },
      machineName: 'new',
      values: [{ primaryKey: 'new', humanName: 'First session' }],
    });
  });

  it('builds a filter definition from the facet for a resource-based filter group', () => {
    const state = {
      filterDefinitions: {
        availability: {} as FilterDefinitionWithValues,
        language: {} as FilterDefinitionWithValues,
        new: {} as FilterDefinitionWithValues,
        organizations: {
          humanName: { defaultMessage: 'Organizations', id: 'organizations' },
          machineName: 'organizations',
          values: [],
        },
        subjects: {} as FilterDefinition,
      },
      resources: {
        courses: {
          byId: {},
          currentQuery: {
            facets: { organizations: { 21: 3, 42: 15, 84: 7 } },
            items: {},
            params: { limit: 20, offset: 0 },
            total_count: 22,
          },
        } as CoursesState,
        organizations: {
          byId: {
            21: { id: 21, name: 'Organization #Twenty-One' } as Organization,
            42: { id: 42, name: 'Organization #Fourty-Two' } as Organization,
            84: { id: 84, name: 'Organization #Eighty-Four' } as Organization,
          },
        },
      },
    };

    expect(getFilterFromState(state as RootState, 'organizations')).toEqual({
      humanName: { defaultMessage: 'Organizations', id: 'organizations' },
      machineName: 'organizations',
      values: [
        { count: 15, humanName: 'Organization #Fourty-Two', primaryKey: '42' },
        { count: 7, humanName: 'Organization #Eighty-Four', primaryKey: '84' },
        { count: 3, humanName: 'Organization #Twenty-One', primaryKey: '21' },
      ],
    });
  });

  it('still builds a default filter group when missing a resource-related facet', () => {
    const state = {
      filterDefinitions: {
        availability: {} as FilterDefinitionWithValues,
        language: {} as FilterDefinitionWithValues,
        new: {} as FilterDefinitionWithValues,
        organizations: {
          humanName: { defaultMessage: 'Organizations', id: 'organizations' },
          machineName: 'organizations',
          values: [],
        },
        subjects: {} as FilterDefinition,
      },
      resources: {
        organizations: {
          byId: {
            21: { id: 21, name: 'Organization #Twenty-One' } as Organization,
            42: { id: 42, name: 'Organization #Fourty-Two' } as Organization,
            84: { id: 84, name: 'Organization #Eighty-Four' } as Organization,
          },
        },
      },
    };

    expect(getFilterFromState(state as RootState, 'organizations')).toEqual({
      humanName: { defaultMessage: 'Organizations', id: 'organizations' },
      machineName: 'organizations',
      values: [
        { humanName: 'Organization #Twenty-One', primaryKey: '21' },
        { humanName: 'Organization #Fourty-Two', primaryKey: '42' },
        { humanName: 'Organization #Eighty-Four', primaryKey: '84' },
      ],
    });
  });
});

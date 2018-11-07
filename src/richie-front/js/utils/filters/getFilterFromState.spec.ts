import { find } from 'lodash-es';

import { CoursesState } from '../../data/courses/reducer';
import { RootState } from '../../data/rootReducer';
import {
  FilterDefinition,
  FilterDefinitionWithValues,
} from '../../types/filters';
import { modelName } from '../../types/models';
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
          machineName: modelName.ORGANIZATIONS,
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

    expect(
      getFilterFromState(state as RootState, modelName.ORGANIZATIONS),
    ).toEqual({
      humanName: { defaultMessage: 'Organizations', id: 'organizations' },
      machineName: modelName.ORGANIZATIONS,
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
          machineName: modelName.ORGANIZATIONS,
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

    const filter = getFilterFromState(
      state as RootState,
      modelName.ORGANIZATIONS,
    );
    expect(filter).toEqual({
      humanName: { defaultMessage: 'Organizations', id: 'organizations' },
      machineName: modelName.ORGANIZATIONS,
      // Values might be mis-ordered as we're sampling them instead of just reusing the array
      values: expect.arrayContaining([
        { humanName: 'Organization #Twenty-One', primaryKey: '21' },
        { humanName: 'Organization #Fourty-Two', primaryKey: '42' },
        { humanName: 'Organization #Eighty-Four', primaryKey: '84' },
      ]),
    });
    // If the array contains only 3 values *and* contains our 3 values, we can reasonably think
    // it's just our three values (arrayContaining does not ensure the array does not contain anything else)
    expect(filter.values.length).toEqual(3);
  });

  it('samples 10 values from the filter definition when there are more than 10 and no facets', () => {
    const state = {
      filterDefinitions: {
        availability: {} as FilterDefinitionWithValues,
        language: {} as FilterDefinitionWithValues,
        new: {} as FilterDefinitionWithValues,
        organizations: {
          humanName: { defaultMessage: 'Organizations', id: 'organizations' },
          machineName: modelName.ORGANIZATIONS,
          values: [],
        },
        subjects: {} as FilterDefinition,
      },
      resources: {
        organizations: {
          byId: {
            // Note we have 12 organizations here
            21: { id: 21, name: 'Organization #Twenty-One' } as Organization,
            22: { id: 22, name: 'Organization #Twenty-Two' } as Organization,
            23: { id: 23, name: 'Organization #Twenty-Three' } as Organization,
            24: { id: 24, name: 'Organization #Twenty-Four' } as Organization,
            42: { id: 42, name: 'Organization #Fourty-Two' } as Organization,
            43: { id: 43, name: 'Organization #Fourty-Three' } as Organization,
            44: { id: 44, name: 'Organization #Fourty-Four' } as Organization,
            45: { id: 45, name: 'Organization #Fourty-Five' } as Organization,
            84: { id: 84, name: 'Organization #Eighty-Four' } as Organization,
            85: { id: 85, name: 'Organization #Eighty-Five' } as Organization,
            86: { id: 86, name: 'Organization #Eighty-Six' } as Organization,
            87: { id: 87, name: 'Organization #Eighty-Seven' } as Organization,
          },
        },
      },
    };

    const filter = getFilterFromState(
      state as RootState,
      modelName.ORGANIZATIONS,
    );
    expect(filter.values.length).toEqual(10);
    // Count included unique organizations
    const uniqueOrgCount = Object.keys(
      state.resources.organizations.byId,
    ).reduce(
      (count, orgId) =>
        count +
        (find(filter.values, item => item.primaryKey === orgId) ? 1 : 0),
      0,
    );
    expect(uniqueOrgCount).toEqual(10);
  });
});

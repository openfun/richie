import { RootState } from '../../data/rootReducer';
import { getActiveFilterValues } from './getActiveFilterValues';

describe('utils/filters/getActiveFilterValues', () => {
  it('returns an empty array if there are no currently active values', () => {
    expect(
      getActiveFilterValues({} as RootState, 'organizations', {
        limit: 20,
        offset: 0,
        organizations: undefined,
      }),
    ).toEqual([]);
  });

  it('returns an array with one FilterValue given a single key', () => {
    const state = {
      resources: {
        organizations: {
          byId: {
            42: { id: 42, name: 'Organization #42' },
          },
        },
      },
    };
    expect(
      getActiveFilterValues(state as any, 'organizations', {
        limit: 20,
        offset: 0,
        organizations: 42,
      }),
    );
  });

  it('returns an array of FilterValues givent an array of keys', () => {
    const state = {
      resources: {
        subjects: {
          byId: {
            21: { id: 21, name: 'Organization #21' },
            22: { id: 22, name: 'Organization #21' },
          },
        },
      },
    };
    expect(
      getActiveFilterValues(state as any, 'subjects', {
        limit: 20,
        offset: 0,
        subjects: [21, 22],
      }),
    );
  });

  it('returns an array of FilterValues from harcoded filter list', () => {
    const state = {
      filterDefinitions: {
        new: {
          humanName: { defaultMessage: 'New courses', id: 'newCourses' },
          machineName: 'new' as 'new',
          values: [{ primaryKey: 'new', humanName: 'First session' }],
        },
      },
    } as any;

    expect(
      getActiveFilterValues(state, 'new', {
        limit: 20,
        new: 'new',
        offset: 0,
      }),
    ).toEqual([
      {
        humanName: 'First session',
        primaryKey: 'new',
      },
    ]);
  });
});

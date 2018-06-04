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
});

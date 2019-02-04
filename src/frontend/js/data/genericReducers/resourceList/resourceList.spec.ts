import { modelName } from '../../../types/models';
import { currentQuery } from './resourceList';

describe('data/genericReducers/resourceList reducer', () => {
  const course43 = {
    categories: [45],
    cover_image: '/about_43.png',
    end: '2018-05-31T06:00:00.000Z',
    enrollment_end: '2018-03-15T06:00:00.000Z',
    enrollment_start: '2018-02-01T06:00:00.000Z',
    id: 43,
    languages: ['fr', 'en'],
    organizations: [23, 31],
    start: '2018-03-01T06:00:00.000Z',
    title: 'Python for data science',
  };

  const course44 = {
    categories: [7, 128],
    cover_image: '/about_44.png',
    end: '2018-04-30T06:00:00.000Z',
    enrollment_end: '2018-02-28T06:00:00.000Z',
    enrollment_start: '2018-02-01T06:00:00.000Z',
    id: 44,
    languages: ['fr', 'de'],
    organizations: [11],
    start: '2018-03-01T06:00:00.000Z',
    title: 'Programming 101 in Python',
  };

  describe('RESOURCE_LIST_GET_SUCCESS', () => {
    it('creates a new query when there is none', () => {
      const previousState = {};
      expect(
        currentQuery(previousState, {
          apiResponse: {
            meta: { limit: 12, offset: 2, total_count: 4 },
            objects: [course43, course44],
          },
          params: { limit: 12, offset: 2 },
          resourceName: modelName.COURSES,
          type: 'RESOURCE_LIST_GET_SUCCESS',
        }),
      )
        // No facets in the apiResponse: we get an empty object in the state
        .toEqual({
          currentQuery: {
            facets: {},
            items: { 2: 43, 3: 44 },
            params: { limit: 12, offset: 2 },
            total_count: 4,
          },
        });
    });

    it('replaces the existing query if the new one has different params', () => {
      const previousState = {
        currentQuery: {
          facets: {},
          items: { 2: 43, 3: 44 },
          params: { limit: 20, offset: 20 },
          total_count: 4,
        },
      };
      expect(
        currentQuery(previousState, {
          apiResponse: {
            facets: { organizations: { 11: 1, 23: 1, 31: 1 } },
            meta: { limit: 2, offset: 0, total_count: 240 },
            objects: [course44, course43],
          },
          params: { limit: 2, match: 'some query', offset: 0 },
          resourceName: modelName.COURSES,
          type: 'RESOURCE_LIST_GET_SUCCESS',
        }),
      ).toEqual({
        currentQuery: {
          // Facets are copied over on the state as-is
          facets: { organizations: { 11: 1, 23: 1, 31: 1 } },
          items: { 0: 44, 1: 43 },
          params: { limit: 2, match: 'some query', offset: 0 },
          total_count: 240,
        },
      });
    });
  });
});

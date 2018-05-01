import { currentQuery } from './resourceList';

describe('data/genericReducers/resourceList reducer', () => {
  const course43 = {
    end_date: '2018-05-31T06:00:00.000Z',
    enrollment_end_date: '2018-03-15T06:00:00.000Z',
    enrollment_start_date: '2018-02-01T06:00:00.000Z',
    id: 43,
    language: 'fr',
    organizations: [23, 31],
    session_number: 1,
    short_description: 'Lorem ipsum dolor sit amet consectetur adipiscim elit.',
    start_date: '2018-03-01T06:00:00.000Z',
    subjects: [45],
    thumbnails: {
      about: 'https://example.com/about_43.png',
      big: 'https://example.com/big_43.png',
      facebook: 'https://example.com/facebook_43.png',
      small: 'https://example.com/small_43.png',
    },
    title: 'Python for data science',
  };

  const course44 = {
    end_date: '2018-04-30T06:00:00.000Z',
    enrollment_end_date: '2018-02-28T06:00:00.000Z',
    enrollment_start_date: '2018-02-01T06:00:00.000Z',
    id: 44,
    language: 'fr',
    organizations: [11],
    session_number: 1,
    short_description: 'Phasellus hendrerit tortor nulla, ut tristique ante aliquam sed.',
    start_date: '2018-03-01T06:00:00.000Z',
    subjects: [7, 128],
    thumbnails: {
      about: 'https://example.com/about_44.png',
      big: 'https://example.com/big_44.png',
      facebook: 'https://example.com/facebook_44.png',
      small: 'https://example.com/small_44.png',
    },
    title: 'Programming 101 in Python',
  };

  describe('RESOURCE_LIST_GET_SUCCESS', () => {
    it('creates a new query when there is none', () => {
      const previousState = {};
      expect(currentQuery(
        previousState,
        {
          apiResponse: {
            meta: { limit: 12, offset: 2, total_count: 4 },
            objects: [ course43, course44 ],
          },
          params: { limit: 12, offset: 2 },
          resourceName: 'courses',
          type: 'RESOURCE_LIST_GET_SUCCESS',
        },
      ))
      // No facets in the apiResponse: we get an empty object in the state
      .toEqual({ currentQuery: { facets: {}, items: { 2: 43, 3: 44 }, queryKey: '{}', total_count: 4 } });
    });

    it('replaces the existing query if the new one has different params', () => {
      const previousState = {
        currentQuery: { facets: {}, items: { 2: 43, 3: 44 }, queryKey: '{}', total_count: 4 },
      };
      expect(currentQuery(
        previousState,
        {
          apiResponse: {
            facets: { organizations: { 11: 1, 23: 1, 31: 1 } },
            meta: { limit: 2, offset: 0, total_count: 240 },
            objects: [ course44, course43 ],
          },
          params: { limit: 2, match: 'some query', offset: 0 },
          resourceName: 'courses',
          type: 'RESOURCE_LIST_GET_SUCCESS',
        },
      ))
      .toEqual({
        currentQuery: {
          // Facets are copied over on the state as-is
          facets: { organizations: { 11: 1, 23: 1, 31: 1 } },
          items: { 0: 44, 1: 43 },
          queryKey: '{"match":"some query"}',
          total_count: 240,
        },
      });
    });
  });
});

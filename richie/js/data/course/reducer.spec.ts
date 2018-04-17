import courseReducer from './reducer';

describe('data/course reducer', () => {
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

  it('returns an empty state for initialization', () => {
    expect(courseReducer(undefined, { type: '' })).toEqual({ byId: {} });
  });

  it('returns the state as is when called with an unknown action', () => {
    const previousState = {
      byId: { 43: course43  },
    };
    expect(courseReducer(previousState, { type: 'TODO_ADD' })).toEqual(previousState);
  });

  describe('resourceById', () => {
    it('drops actions that do not match the resourceName', () => {
      const previousState = { byId: { 43: course43  } };

      expect(courseReducer(previousState, {
        resource: course44,
        resourceName: 'subject',
        type: 'RESOURCE_ADD',
      })).toEqual(previousState);
    });

    it('uses actions that match the resourceName', () => {
      const previousState = { byId: { 43: course43  } };

      expect(courseReducer(previousState, {
        resource: course44,
        resourceName: 'course',
        type: 'RESOURCE_ADD',
      })).toEqual({ byId: { 43: course43, 44: course44 } });
    });
  });
});

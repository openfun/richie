import { modelName } from '../../types/models';
import { courses } from './reducer';

describe('data/courses reducer', () => {
  const course43 = {
    end_date: '2018-05-31T06:00:00.000Z',
    enrollment_end_date: '2018-03-15T06:00:00.000Z',
    enrollment_start_date: '2018-02-01T06:00:00.000Z',
    id: 43,
    language: 'fr',
    organization_main: 23,
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
    organization_main: 11,
    organizations: [11],
    session_number: 1,
    short_description:
      'Phasellus hendrerit tortor nulla, ut tristique ante aliquam sed.',
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
    expect(courses(undefined, { type: '' })).toEqual({ byId: {} });
  });

  it('returns the state as is when called with an unknown action', () => {
    const previousState = {
      byId: { 43: course43 },
    };
    expect(courses(previousState, { type: 'TODO_ADD' })).toEqual(previousState);
  });

  describe('resourceById', () => {
    it('drops actions that do not match the resourceName', () => {
      const previousState = { byId: { 43: course43 } };

      expect(
        courses(previousState, {
          resource: course44,
          resourceName: modelName.SUBJECTS,
          type: 'RESOURCE_ADD',
        }),
      ).toEqual(previousState);
    });

    it('uses actions that match the resourceName', () => {
      const previousState = { byId: { 43: course43 } };

      expect(
        courses(previousState, {
          resource: course44,
          resourceName: modelName.COURSES,
          type: 'RESOURCE_ADD',
        }),
      ).toEqual({ byId: { 43: course43, 44: course44 } });
    });
  });
});

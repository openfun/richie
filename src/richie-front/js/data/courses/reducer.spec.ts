import { modelName } from '../../types/models';
import { courses } from './reducer';

describe('data/courses reducer', () => {
  const course43 = {
    absolute_url: '/course-slug-43',
    cover_image: '/about_43.png',
    end: '2018-05-31T06:00:00.000Z',
    enrollment_end: '2018-03-15T06:00:00.000Z',
    enrollment_start: '2018-02-01T06:00:00.000Z',
    id: 43,
    languages: ['fr', 'en'],
    organizations: [23, 31],
    start: '2018-03-01T06:00:00.000Z',
    subjects: [45],
    title: 'Python for data science',
  };

  const course44 = {
    absolute_url: '/course-slug-44',
    cover_image: '/about_44.png',
    end: '2018-04-30T06:00:00.000Z',
    enrollment_end: '2018-02-28T06:00:00.000Z',
    enrollment_start: '2018-02-01T06:00:00.000Z',
    id: 44,
    languages: ['fr', 'de'],
    organizations: [11],
    start: '2018-03-01T06:00:00.000Z',
    subjects: [7, 128],
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

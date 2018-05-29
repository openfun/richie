import { FilterDefinitionState } from '../../data/filterDefinitions/reducer';
import { Course } from '../../types/Course';
import { mapStateToProps, mergeProps } from './CourseGlimpseContainer';

describe('components/CourseGlimpseContainer', () => {
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

  const org23 = {
    banner: 'https://example.com/banner23.png',
    code: 'org-23',
    detail_page_enabled: false,
    id: 23,
    logo: 'https://example.com/logo23.png',
    name: 'Org 23',
  };

  it('mapStateToProps picks in state the organization relevant to the current course', () => {
    const state = {
      filterDefinitions: {} as FilterDefinitionState,
      resources: {
        organizations: { byId: { 23: org23 } },
      },
    };

    expect(mapStateToProps(state, { course: course43 })).toEqual({
      organization: org23,
    });
  });

  it('mergeProps takes the organization from mapState and the course from ownProps', () => {
    const stateProps = { organization: org23 };
    const ownProps = { course: course43 };

    expect(mergeProps(stateProps, null, ownProps)).toEqual({
      course: course43,
      organization: org23,
    });
  });
});

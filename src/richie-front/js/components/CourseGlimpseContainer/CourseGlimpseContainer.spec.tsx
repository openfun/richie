import { FilterDefinitionState } from '../../data/filterDefinitions/reducer';
import { mapStateToProps, mergeProps } from './CourseGlimpseContainer';

describe('components/CourseGlimpseContainer', () => {
  const course43 = {
    absolute_url: '/course-path-43',
    cover_image: '/about_43.png',
    end: '2018-05-31T06:00:00.000Z',
    enrollment_end: '2018-03-15T06:00:00.000Z',
    enrollment_start: '2018-02-01T06:00:00.000Z',
    id: 43,
    languages: ['fr', 'pt'],
    organizations: [23, 31],
    start: '2018-03-01T06:00:00.000Z',
    subjects: [45],
    title: 'Python for data science',
  };

  const org23 = {
    detail_page_enabled: false,
    id: 23,
    logo: 'https://example.com/logo23.png',
    title: 'Org 23',
  };

  it('mapStateToProps picks in state the organization relevant to the current course', () => {
    const state = {
      filterDefinitions: {} as FilterDefinitionState,
      resources: {
        organizations: { byId: { 23: org23 } },
      },
    };

    expect(mapStateToProps(state, { course: course43 })).toEqual({
      organizationMain: org23,
    });
  });

  it('mergeProps takes the organization from mapState and the course from ownProps', () => {
    const stateProps = { organizationMain: org23 };
    const ownProps = { course: course43 };

    expect(mergeProps(stateProps, null, ownProps)).toEqual({
      course: course43,
      organizationMain: org23,
    });
  });
});

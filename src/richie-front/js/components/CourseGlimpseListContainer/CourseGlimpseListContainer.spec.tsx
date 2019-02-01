import { FilterDefinitionState } from '../../data/filterDefinitions/reducer';
import { modelName } from '../../types/models';
import { mapStateToProps, mergeProps } from './CourseGlimpseListContainer';

describe('components/CourseGlimpseListContainer', () => {
  describe('mapStateToProps', () => {
    it('mapStateToProps builds a list of courses & gets the current params from state', () => {
      const course43 = {
        absolute_url: '/course-path-43',
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
        absolute_url: '/course-path-44',
        categories: [7, 128],
        cover_image: '/about_44.png',
        end: '2018-04-30T06:00:00.000Z',
        enrollment_end: '2018-02-28T06:00:00.000Z',
        enrollment_start: '2018-02-01T06:00:00.000Z',
        id: 44,
        languages: ['fr', 'es'],
        organizations: [11],
        start: '2018-03-01T06:00:00.000Z',
        title: 'Programming 101 in Python',
      };

      const state = {
        filterDefinitions: {} as FilterDefinitionState,
        resources: {
          courses: {
            byId: { 43: course43, 44: course44 },
            currentQuery: {
              facets: {},
              items: { 0: 44, 1: 43 },
              params: { limit: 2, offset: 0 },
              total_count: 2,
            },
          },
        },
      };

      expect(mapStateToProps(state)).toEqual({
        courses: [course44, course43],
        currentParams: { limit: 2, offset: 0 },
      });
    });
  });

  describe('mergeProps/requestCourses', () => {
    it('dispatches a RESOURCE_LIST_GET with params from mapStateToProps', () => {
      const dispatch = jasmine.createSpy('dispatch');
      const props = mergeProps(
        {
          courses: [],
          currentParams: { limit: 999, offset: 0, categories: 42 },
        },
        { dispatch },
      );
      props.requestCourses();

      expect(dispatch).toHaveBeenCalledWith({
        params: { limit: 999, offset: 0, categories: 42 },
        resourceName: modelName.COURSES,
        type: 'RESOURCE_LIST_GET',
      });
    });
  });
});

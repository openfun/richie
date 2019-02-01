import fetchMock from 'fetch-mock';
import { call, put } from 'redux-saga/effects';

import { modelName } from '../../../types/models';
import { addMultipleResources } from '../../genericReducers/resourceById/actions';
import { didGetResourceList, failedToGetResourceList } from './actions';
import { fetchList, getList } from './getResourceList';

// We'll be testing with a course-like Resource as the saga needs some specifics to operate: we want
// something simple but we don't want to rely on the specific implementation of a resource
describe('data/genericSideEffects/getResourceList saga', () => {
  const course43 = {
    categories: [45],
    cover_image: '/about_43.png',
    end: '2018-05-31T06:00:00.000Z',
    enrollment_end: '2018-03-15T06:00:00.000Z',
    enrollment_start: '2018-02-01T06:00:00.000Z',
    id: 43,
    languages: ['fr', 'it'],
    organizations: [23, 31],
    session_number: 1,
    short_description: 'Lorem ipsum dolor sit amet consectetur adipiscim elit.',
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
    languages: ['fr', 'es'],
    organizations: [11],
    session_number: 1,
    short_description:
      'Phasellus hendrerit tortor nulla, ut tristique ante aliquam sed.',
    start: '2018-03-01T06:00:00.000Z',
    title: 'Programming 101 in Python',
  };

  describe('fetchList', () => {
    afterEach(fetchMock.restore);

    it('requests the resource list, parses the JSON response and resolves with the results', async () => {
      fetchMock.mock(
        '/api/v1.0/courses/?limit=2&offset=43',
        JSON.stringify({ objects: [course43, course44] }),
      );

      const response = await fetchList(modelName.COURSES, {
        limit: 2,
        offset: 43,
      });

      // Our polymorphic response object is properly shaped
      expect(response.error).not.toBeTruthy();
      expect(response.objects).toEqual([course43, course44]);
    });

    it('returns an { error } object when it fails to get the resource list (local)', async () => {
      fetchMock.mock(
        '/api/v1.0/courses/?limit=2&offset=43',
        Promise.reject(new Error('Failed to perform the request')),
      );

      const response = await fetchList(modelName.COURSES, {
        limit: 2,
        offset: 43,
      });

      // Our polymorphic response object is properly shaped - with an error this time
      expect(response.objects).not.toBeDefined();
      expect(response.error).toEqual(jasmine.any(Error));
    });

    it('returns an { error } object when it fails to get the resource list (network)', async () => {
      fetchMock.mock('/api/v1.0/courses/?limit=2&offset=43', 404);

      const response = await fetchList(modelName.COURSES, {
        limit: 2,
        offset: 43,
      });

      // Our polymorphic response object is properly shaped - with an error this time
      expect(response.objects).not.toBeDefined();
      expect(response.error).toEqual(jasmine.any(Error));
    });
  });

  describe('getList', () => {
    const action = {
      params: { limit: 10, name: 'python', offset: 0 },
      resourceName: modelName.COURSES,
      type: 'RESOURCE_LIST_GET' as 'RESOURCE_LIST_GET',
    };

    it('calls fetchList, puts each resource and yields a success action', () => {
      const gen = getList(action);

      // Mock a 'list of courses' response with which to trigger the call to fetchCourses
      const response = {
        meta: { limit: 10, offset: 0, total_count: 120 },
        objects: [course43, course44],
      };

      // The call to fetch (the actual side-effect) is triggered
      expect(gen.next().value).toEqual(
        call(fetchList, modelName.COURSES, action.params),
      );
      // Both courses are added to the state
      expect(gen.next(response).value).toEqual(
        put(addMultipleResources(modelName.COURSES, response.objects)),
      );
      // The success action is dispatched
      expect(gen.next().value).toEqual(
        put(didGetResourceList(modelName.COURSES, response, action.params)),
      );
    });

    it('yields a failure action when fetchList fails', () => {
      const gen = getList(action);

      const response = {
        error: new Error('Failed to fetch resources for some reason.'),
      };

      // The call to fetch is triggered, but fails for some reason
      expect(gen.next().value).toEqual(
        call(fetchList, modelName.COURSES, action.params),
      );
      // The failure action is dispatched
      expect(gen.next(response).value).toEqual(
        put(failedToGetResourceList(modelName.COURSES, response.error)),
      );
    });
  });
});

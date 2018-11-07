import { call, put } from 'redux-saga/effects';

import { modelName } from '../../../types/models';
import { addMultipleResources } from '../../genericReducers/resourceById/actions';
import { didGetResourceList, failedToGetResourceList } from './actions';
import { fetchList, getList } from './getResourceList';

// We'll be testing with the a course-lik Resource as the saga needs some specifics to operate: we want
// something simple but we don't want to rely on the specific implementation of a resource
describe('data/genericSideEffects/getResourceList saga', () => {
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

  describe('fetchList', () => {
    let realFetch: GlobalFetch['fetch'];
    let mockFetch: jasmine.Spy;

    beforeEach(() => {
      realFetch = window.fetch;
      mockFetch = jasmine.createSpy('fetch');
      window.fetch = mockFetch;
    });

    afterEach(() => {
      window.fetch = realFetch;
    });

    it('requests the resource list, parses the JSON response and resolves with the results', done => {
      mockFetch.and.returnValue(
        Promise.resolve({
          json: () => Promise.resolve({ objects: [course43, course44] }),
          ok: true,
        }),
      );

      fetchList(modelName.COURSES, { limit: 2, offset: 43 }).then(response => {
        // The correct request given parameters is performed
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/v1.0/courses/?limit=2&offset=43',
          {
            headers: { 'Content-Type': 'application/json' },
          },
        );
        // Our polymorphic response object is properly shaped
        expect(response.error).not.toBeTruthy();
        expect(response.objects).toEqual([course43, course44]);
        done();
      });
    });

    it('returns an { error } object when it fails to get the resource list (local)', done => {
      mockFetch.and.returnValue(
        Promise.reject(new Error('Could not perform fetch.')),
      );

      // Don't check params again as it was done in the first test
      fetchList(modelName.COURSES, { limit: 2, offset: 43 }).then(response => {
        // Our polymorphic response object is properly shaped - with an error this time
        expect(response.objects).not.toBeDefined();
        expect(response.error).toEqual(jasmine.any(Error));
        done();
      });
    });

    it('returns an { error } object when it fails to get the resource list (network)', done => {
      mockFetch.and.returnValue(Promise.resolve({ ok: false, status: 404 }));

      // Don't check params again as it was done in the first test
      fetchList(modelName.COURSES, { limit: 2, offset: 43 }).then(response => {
        // Our polymorphic response object is properly shaped - with an error this time
        expect(response.objects).not.toBeDefined();
        expect(response.error).toEqual(jasmine.any(Error));
        done();
      });
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

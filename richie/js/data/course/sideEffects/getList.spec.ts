import { call, put, takeLatest } from 'redux-saga/effects';

import { addCourse, didGetCourseList, failedToGetCourseList } from '../actions';
import { fetchCourses, getCourses } from './getList';

describe('data/course getList saga', () => {
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

  describe('fetchCourses', () => {
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

    it('requests the course list, parses the JSON response and resolves with the results', (done) => {
      mockFetch.and.returnValue(Promise.resolve({
        json: () => Promise.resolve({ objects: [ course43, course44 ] }),
        ok: true,
      }));

      fetchCourses({ limit: 2, offset: 43 })
      .then((response) => {
        // The correct request given parameters is performed
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/v1.0/course?limit=2&offset=43',
          { headers: { 'Content-Type': 'application/json' },
        });
        // Our polymorphic response object is properly shaped
        expect(response.error).not.toBeTruthy();
        expect(response.objects).toEqual([ course43, course44 ]);
        done();
      });
    });

    it('returns an { error } object when it fails to get the course list (local)', (done) => {
      mockFetch.and.returnValue(Promise.reject(new Error('Could not perform fetch.')));

      // Don't check params again as it was done in the first test
      fetchCourses({ limit: 2, offset: 43 })
      .then((response) => {
        // Our polymorphic response object is properly shaped - with an error this time
        expect(response.objects).not.toBeDefined();
        expect(response.error).toEqual(jasmine.any(Error));
        done();
      });
    });

    it('returns an { error } object when it fails to get the course list (network)', (done) => {
      mockFetch.and.returnValue(Promise.resolve({ ok: false, status: 404 }));

      // Don't check params again as it was done in the first test
      fetchCourses({ limit: 2, offset: 43 })
      .then((response) => {
        // Our polymorphic response object is properly shaped - with an error this time
        expect(response.objects).not.toBeDefined();
        expect(response.error).toEqual(jasmine.any(Error));
        done();
      });
    });
  });

  describe('getCourses', () => {
    const action = {
      params: { limit: 10, name: 'python', offset: 0 },
      type: 'COURSE_LIST_GET' as 'COURSE_LIST_GET',
    };

    it('calls fetchCourses, puts each course and yields a success action', () => {
      const gen = getCourses(action);

      // Mock a 'list of courses' response with which to trigger the call to fetchCourses
      const response = {
        meta: { limit: 10, offset: 0, total_count: 120 },
        objects: [ course43, course44 ],
      };

      // The call to fetch (the actual side-effect) is triggered
      expect(gen.next().value).toEqual(call(fetchCourses, action.params));
      // Both courses are added to the state
      expect(gen.next(response).value).toEqual(put(addCourse(response.objects[0])));
      expect(gen.next().value).toEqual(put(addCourse(response.objects[1])));
      // The success action is dispatched
      expect(gen.next().value).toEqual(put(didGetCourseList(response, action.params)));
    });

    it('yields a failure action when fetchCourses fails', () => {
      const gen = getCourses(action);

      const response = {
        error: new Error('Failed to fetch courses for some reason.'),
      };

      // The call to fetch is triggered, but fails for some reason
      expect(gen.next().value).toEqual(call(fetchCourses, action.params));
      // The failure action is dispatched
      expect(gen.next(response).value).toEqual(put(failedToGetCourseList(response.error)));
    });
  });
});

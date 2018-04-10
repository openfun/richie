import { call, put, takeLatest } from 'redux-saga/effects';

import { API_ENDPOINTS } from '../../../settings.json';
import Course from '../../../types/Course';
import formatQueryString from '../../../utils/http/formatQueryString';
import { addCourse, CourseListGet, didGetCourseList, failedToGetCourseList } from '../actions';

// Use a polymorphic response object so it can be elegantly consumed through destructuration
interface Response {
  error?: string;
  facets?: {
    organization: {[organizationId: number]: number};
    subject: {[subjectId: number]: number};
  };
  meta?: {
    limit: number;
    offset: number;
    total_count: number;
  };
  objects?: Course[];
}

// Wrap fetch to handle params, headers, parsing & sane response handling
// NB: some of this logic should be move in a separate module when we reuse it elsewhere
export function fetchCourses(params?: CourseListGet['params']): Promise<Response> {
  return fetch(API_ENDPOINTS.COURSE + formatQueryString(params), {
    headers: {
      'Content-Type': 'application/json',
    },
  })
  .then((response) => {
    // Fetch treats remote errors (400, 404, 503...) as successes. The ok flag is the way to discriminate.
    if (response.ok) {
      return response;
    }
    // Push remote errors to the error channel for consistency
    throw new Error('Failed to get the course list: ' + response.status);
  })
  .then((response) => response.json())
  .catch((error) => ({ error }));
}

export function* getCourses(action: CourseListGet) {
  const { params } = action;
  const { error, facets, meta, objects }: Response = yield call(fetchCourses, params);

  if (error) {
    yield put(failedToGetCourseList(error));
  } else {
    // Add each individual course to the state before we put the success action in
    // order to avoid race conditions / incomplete data sets
    for (const course of objects) {
      yield put(addCourse(course));
    }
    yield put(didGetCourseList({ meta, objects }, params));
  }
}

export default function* watch() {
  // We can cancel ongoing requests whenever there's a new one: the user will not request several different sets
  // of filters of the same kind at the same time.
  yield takeLatest('COURSE_LIST_GET', getCourses);
}

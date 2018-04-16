import { APIListCommonRequestParams, APIResponseListMeta } from '../../types/api';
import Course from '../../types/Course';
import { ResourceAdd } from '../genericReducers/resourceById/actions';

export function addCourse(course: Course): ResourceAdd<Course> {
  return {
    resource: course,
    resourceName: 'course',
    type: 'RESOURCE_ADD',
  };
}

export interface CourseListGet {
  params?: APIListCommonRequestParams & {
    name?: string | number | null | string[] | number[];
  };
  type: 'COURSE_LIST_GET';
}

export function getCourseList(params?: CourseListGet['params']): CourseListGet {
  return {
    params,
    type: 'COURSE_LIST_GET',
  };
}

export interface CourseListGetSuccess {
  apiResponse: { meta: APIResponseListMeta, objects: Course[] };
  params: CourseListGet['params'];
  type: 'COURSE_LIST_GET_SUCCESS';
}

export function didGetCourseList(
  apiResponse: CourseListGetSuccess['apiResponse'],
  params: CourseListGetSuccess['params'],
): CourseListGetSuccess {
  return {
    apiResponse,
    params,
    type: 'COURSE_LIST_GET_SUCCESS',
  };
}

export interface CourseListGetFailure {
  error: Error | string;
  type: 'COURSE_LIST_GET_FAILURE';
}

export function failedToGetCourseList(error: CourseListGetFailure['error']): CourseListGetFailure {
  return {
    error,
    type: 'COURSE_LIST_GET_FAILURE',
  };
}

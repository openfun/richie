import { APIListCommonRequestParams, APIResponseListMeta } from '../../types/api';
import Course from '../../types/Course';

export interface CourseAdd {
  course: Course;
  type: 'COURSE_ADD';
}

export function addCourse(course: Course): CourseAdd {
  return {
    course,
    type: 'COURSE_ADD',
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

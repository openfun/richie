/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CourseRun } from '../models/CourseRun';
import type { PaginatedCourseRunList } from '../models/PaginatedCourseRunList';

import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';

export class CourseRunsService {

  constructor(public readonly httpRequest: BaseHttpRequest) {}

  /**
   * API ViewSet for all interactions with course runs.
   * @param page A page number within the paginated result set.
   * @param pageSize Number of results to return per page.
   * @returns PaginatedCourseRunList
   * @throws ApiError
   */
  public courseRunsList(
    page?: number,
    pageSize?: number,
  ): CancelablePromise<PaginatedCourseRunList> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/api/v1.0/course-runs/',
      query: {
        'page': page,
        'page_size': pageSize,
      },
    });
  }

  /**
   * API ViewSet for all interactions with course runs.
   * @param id
   * @returns CourseRun
   * @throws ApiError
   */
  public courseRunsRetrieve(
    id: string,
  ): CancelablePromise<CourseRun> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/api/v1.0/course-runs/{id}/',
      path: {
        'id': id,
      },
    });
  }

}

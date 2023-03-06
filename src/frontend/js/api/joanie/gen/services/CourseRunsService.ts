/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CourseRun } from '../models/CourseRun';

import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';

export class CourseRunsService {

  constructor(public readonly httpRequest: BaseHttpRequest) {}

  /**
   * API ViewSet for all interactions with course runs.
   * @param id primary key for the record as UUID
   * @returns CourseRun
   * @throws ApiError
   */
  public courseRunsRead(
    id: string,
  ): CancelablePromise<CourseRun> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/course-runs/{id}/',
      path: {
        'id': id,
      },
    });
  }

}

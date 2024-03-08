/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Enrollment } from '../models/Enrollment';
import type { EnrollmentRequest } from '../models/EnrollmentRequest';
import type { PaginatedEnrollmentList } from '../models/PaginatedEnrollmentList';
import type { PatchedEnrollmentRequest } from '../models/PatchedEnrollmentRequest';

import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';

export class EnrollmentsService {

  constructor(public readonly httpRequest: BaseHttpRequest) {}

  /**
   * API ViewSet for all interactions with enrollments.
   * @param courseRunId
   * @param page A page number within the paginated result set.
   * @param pageSize Number of results to return per page.
   * @param query
   * @param wasCreatedByOrder
   * @returns PaginatedEnrollmentList
   * @throws ApiError
   */
  public enrollmentsList(
    courseRunId?: string,
    page?: number,
    pageSize?: number,
    query?: string,
    wasCreatedByOrder?: boolean,
  ): CancelablePromise<PaginatedEnrollmentList> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/api/v1.0/enrollments/',
      query: {
        'course_run_id': courseRunId,
        'page': page,
        'page_size': pageSize,
        'query': query,
        'was_created_by_order': wasCreatedByOrder,
      },
    });
  }

  /**
   * API ViewSet for all interactions with enrollments.
   * @param requestBody
   * @returns Enrollment
   * @throws ApiError
   */
  public enrollmentsCreate(
    requestBody: EnrollmentRequest,
  ): CancelablePromise<Enrollment> {
    return this.httpRequest.request({
      method: 'POST',
      url: '/api/v1.0/enrollments/',
      body: requestBody,
      mediaType: 'application/json',
    });
  }

  /**
   * API ViewSet for all interactions with enrollments.
   * @param id
   * @returns Enrollment
   * @throws ApiError
   */
  public enrollmentsRetrieve(
    id: string,
  ): CancelablePromise<Enrollment> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/api/v1.0/enrollments/{id}/',
      path: {
        'id': id,
      },
    });
  }

  /**
   * API ViewSet for all interactions with enrollments.
   * @param id
   * @param requestBody
   * @returns Enrollment
   * @throws ApiError
   */
  public enrollmentsUpdate(
    id: string,
    requestBody: EnrollmentRequest,
  ): CancelablePromise<Enrollment> {
    return this.httpRequest.request({
      method: 'PUT',
      url: '/api/v1.0/enrollments/{id}/',
      path: {
        'id': id,
      },
      body: requestBody,
      mediaType: 'application/json',
    });
  }

  /**
   * API ViewSet for all interactions with enrollments.
   * @param id
   * @param requestBody
   * @returns Enrollment
   * @throws ApiError
   */
  public enrollmentsPartialUpdate(
    id: string,
    requestBody?: PatchedEnrollmentRequest,
  ): CancelablePromise<Enrollment> {
    return this.httpRequest.request({
      method: 'PATCH',
      url: '/api/v1.0/enrollments/{id}/',
      path: {
        'id': id,
      },
      body: requestBody,
      mediaType: 'application/json',
    });
  }

}

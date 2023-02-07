/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CourseProductRelation } from '../models/CourseProductRelation';
import type { PaginatedCourseProductRelationList } from '../models/PaginatedCourseProductRelationList';

import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';

export class CourseProductRelationsService {

  constructor(public readonly httpRequest: BaseHttpRequest) {}

  /**
   * API ViewSet for all interactions with course-product relations.
   * Can be accessed through multiple URLs
   * GET /courses/
   * Return all courses the user has access to
   * GET /organizations/<organization_id>/courses/
   * Return all courses from the specified organization if user
   * has access to the organization
   * @param page A page number within the paginated result set.
   * @param pageSize Number of results to return per page.
   * @param productType * `credential` - Credential
   * * `enrollment` - Enrollment
   * * `certificate` - Certificate
   * @param productTypeExclude * `credential` - Credential
   * * `enrollment` - Enrollment
   * * `certificate` - Certificate
   * @param query
   * @returns PaginatedCourseProductRelationList
   * @throws ApiError
   */
  public courseProductRelationsList(
    page?: number,
    pageSize?: number,
    productType?: Array<'certificate' | 'credential' | 'enrollment'>,
    productTypeExclude?: Array<'certificate' | 'credential' | 'enrollment'>,
    query?: string,
  ): CancelablePromise<PaginatedCourseProductRelationList> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/api/v1.0/course-product-relations/',
      query: {
        'page': page,
        'page_size': pageSize,
        'product_type': productType,
        'product_type_exclude': productTypeExclude,
        'query': query,
      },
    });
  }

  /**
   * API ViewSet for all interactions with course-product relations.
   * Can be accessed through multiple URLs
   * GET /courses/
   * Return all courses the user has access to
   * GET /organizations/<organization_id>/courses/
   * Return all courses from the specified organization if user
   * has access to the organization
   * @param pkOrProductId
   * @returns CourseProductRelation
   * @throws ApiError
   */
  public courseProductRelationsRetrieve(
    pkOrProductId: string,
  ): CancelablePromise<CourseProductRelation> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/api/v1.0/course-product-relations/{pk_or_product_id}/',
      path: {
        'pk_or_product_id': pkOrProductId,
      },
    });
  }

}

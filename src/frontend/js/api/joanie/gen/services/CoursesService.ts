/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Contract } from '../models/Contract';
import type { Course } from '../models/Course';
import type { CourseAccess } from '../models/CourseAccess';
import type { CourseAccessRequest } from '../models/CourseAccessRequest';
import type { CourseProductRelation } from '../models/CourseProductRelation';
import type { CourseRequest } from '../models/CourseRequest';
import type { CourseRun } from '../models/CourseRun';
import type { PaginatedContractList } from '../models/PaginatedContractList';
import type { PaginatedCourseAccessList } from '../models/PaginatedCourseAccessList';
import type { PaginatedCourseList } from '../models/PaginatedCourseList';
import type { PaginatedCourseProductRelationList } from '../models/PaginatedCourseProductRelationList';
import type { PaginatedCourseRunList } from '../models/PaginatedCourseRunList';
import type { PaginatedNestedOrderCourseList } from '../models/PaginatedNestedOrderCourseList';
import type { PatchedCourseAccessRequest } from '../models/PatchedCourseAccessRequest';

import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';

export class CoursesService {

  constructor(public readonly httpRequest: BaseHttpRequest) {}

  /**
   * API ViewSet for all interactions with courses.
   *
   * GET /api/courses/
   * Return list of all courses related to the logged-in user.
   *
   * GET /api/courses/:<course_id|course_code>
   * Return one course if an id is provided.
   *
   * GET /api/courses/:<course_id|course_code>/wish
   * Return wish status on this course for the authenticated user
   *
   * POST /api/courses/:<course_id|course_code>/wish
   * Confirm a wish on this course for the authenticated user
   *
   * DELETE /api/courses/:<course_id|course_code>/wish
   * Delete any existing wish on this course for the authenticated user
   * @param hasListedCourseRuns
   * @param page A page number within the paginated result set.
   * @param pageSize Number of results to return per page.
   * @param productType * `credential` - Credential
   * * `enrollment` - Enrollment
   * * `certificate` - Certificate
   * @param query
   * @returns PaginatedCourseList
   * @throws ApiError
   */
  public coursesList(
    hasListedCourseRuns?: boolean,
    page?: number,
    pageSize?: number,
    productType?: 'certificate' | 'credential' | 'enrollment',
    query?: string,
  ): CancelablePromise<PaginatedCourseList> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/api/v1.0/courses/',
      query: {
        'has_listed_course_runs': hasListedCourseRuns,
        'page': page,
        'page_size': pageSize,
        'product_type': productType,
        'query': query,
      },
    });
  }

  /**
   * API ViewSet for all interactions with course accesses.
   *
   * GET /api/courses/<course_id|course_code>/accesses/:<course_access_id>
   * Return list of all course accesses related to the logged-in user or one
   * course access if an id is provided.
   *
   * POST /api/courses/<course_id|course_code>/accesses/ with expected data:
   * - user: str
   * - role: str [owner|admin|member]
   * Return newly created course access
   *
   * PUT /api/courses/<course_id|course_code>/accesses/<course_access_id>/ with expected data:
   * - role: str [owner|admin|member]
   * Return updated course access
   *
   * PATCH /api/courses/<course_id|course_code>/accesses/<course_access_id>/ with expected data:
   * - role: str [owner|admin|member]
   * Return partially updated course access
   *
   * DELETE /api/courses/<course_id|course_code>/accesses/<course_access_id>/
   * Delete targeted course access
   * @param courseId
   * @param page A page number within the paginated result set.
   * @param pageSize Number of results to return per page.
   * @returns PaginatedCourseAccessList
   * @throws ApiError
   */
  public coursesAccessesList(
    courseId: string,
    page?: number,
    pageSize?: number,
  ): CancelablePromise<PaginatedCourseAccessList> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/api/v1.0/courses/{course_id}/accesses/',
      path: {
        'course_id': courseId,
      },
      query: {
        'page': page,
        'page_size': pageSize,
      },
    });
  }

  /**
   * API ViewSet for all interactions with course accesses.
   *
   * GET /api/courses/<course_id|course_code>/accesses/:<course_access_id>
   * Return list of all course accesses related to the logged-in user or one
   * course access if an id is provided.
   *
   * POST /api/courses/<course_id|course_code>/accesses/ with expected data:
   * - user: str
   * - role: str [owner|admin|member]
   * Return newly created course access
   *
   * PUT /api/courses/<course_id|course_code>/accesses/<course_access_id>/ with expected data:
   * - role: str [owner|admin|member]
   * Return updated course access
   *
   * PATCH /api/courses/<course_id|course_code>/accesses/<course_access_id>/ with expected data:
   * - role: str [owner|admin|member]
   * Return partially updated course access
   *
   * DELETE /api/courses/<course_id|course_code>/accesses/<course_access_id>/
   * Delete targeted course access
   * @param courseId
   * @param requestBody
   * @returns CourseAccess
   * @throws ApiError
   */
  public coursesAccessesCreate(
    courseId: string,
    requestBody: CourseAccessRequest,
  ): CancelablePromise<CourseAccess> {
    return this.httpRequest.request({
      method: 'POST',
      url: '/api/v1.0/courses/{course_id}/accesses/',
      path: {
        'course_id': courseId,
      },
      body: requestBody,
      mediaType: 'application/json',
    });
  }

  /**
   * API ViewSet for all interactions with course accesses.
   *
   * GET /api/courses/<course_id|course_code>/accesses/:<course_access_id>
   * Return list of all course accesses related to the logged-in user or one
   * course access if an id is provided.
   *
   * POST /api/courses/<course_id|course_code>/accesses/ with expected data:
   * - user: str
   * - role: str [owner|admin|member]
   * Return newly created course access
   *
   * PUT /api/courses/<course_id|course_code>/accesses/<course_access_id>/ with expected data:
   * - role: str [owner|admin|member]
   * Return updated course access
   *
   * PATCH /api/courses/<course_id|course_code>/accesses/<course_access_id>/ with expected data:
   * - role: str [owner|admin|member]
   * Return partially updated course access
   *
   * DELETE /api/courses/<course_id|course_code>/accesses/<course_access_id>/
   * Delete targeted course access
   * @param courseId
   * @param id
   * @returns CourseAccess
   * @throws ApiError
   */
  public coursesAccessesRetrieve(
    courseId: string,
    id: string,
  ): CancelablePromise<CourseAccess> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/api/v1.0/courses/{course_id}/accesses/{id}/',
      path: {
        'course_id': courseId,
        'id': id,
      },
    });
  }

  /**
   * API ViewSet for all interactions with course accesses.
   *
   * GET /api/courses/<course_id|course_code>/accesses/:<course_access_id>
   * Return list of all course accesses related to the logged-in user or one
   * course access if an id is provided.
   *
   * POST /api/courses/<course_id|course_code>/accesses/ with expected data:
   * - user: str
   * - role: str [owner|admin|member]
   * Return newly created course access
   *
   * PUT /api/courses/<course_id|course_code>/accesses/<course_access_id>/ with expected data:
   * - role: str [owner|admin|member]
   * Return updated course access
   *
   * PATCH /api/courses/<course_id|course_code>/accesses/<course_access_id>/ with expected data:
   * - role: str [owner|admin|member]
   * Return partially updated course access
   *
   * DELETE /api/courses/<course_id|course_code>/accesses/<course_access_id>/
   * Delete targeted course access
   * @param courseId
   * @param id
   * @param requestBody
   * @returns CourseAccess
   * @throws ApiError
   */
  public coursesAccessesUpdate(
    courseId: string,
    id: string,
    requestBody: CourseAccessRequest,
  ): CancelablePromise<CourseAccess> {
    return this.httpRequest.request({
      method: 'PUT',
      url: '/api/v1.0/courses/{course_id}/accesses/{id}/',
      path: {
        'course_id': courseId,
        'id': id,
      },
      body: requestBody,
      mediaType: 'application/json',
    });
  }

  /**
   * API ViewSet for all interactions with course accesses.
   *
   * GET /api/courses/<course_id|course_code>/accesses/:<course_access_id>
   * Return list of all course accesses related to the logged-in user or one
   * course access if an id is provided.
   *
   * POST /api/courses/<course_id|course_code>/accesses/ with expected data:
   * - user: str
   * - role: str [owner|admin|member]
   * Return newly created course access
   *
   * PUT /api/courses/<course_id|course_code>/accesses/<course_access_id>/ with expected data:
   * - role: str [owner|admin|member]
   * Return updated course access
   *
   * PATCH /api/courses/<course_id|course_code>/accesses/<course_access_id>/ with expected data:
   * - role: str [owner|admin|member]
   * Return partially updated course access
   *
   * DELETE /api/courses/<course_id|course_code>/accesses/<course_access_id>/
   * Delete targeted course access
   * @param courseId
   * @param id
   * @param requestBody
   * @returns CourseAccess
   * @throws ApiError
   */
  public coursesAccessesPartialUpdate(
    courseId: string,
    id: string,
    requestBody?: PatchedCourseAccessRequest,
  ): CancelablePromise<CourseAccess> {
    return this.httpRequest.request({
      method: 'PATCH',
      url: '/api/v1.0/courses/{course_id}/accesses/{id}/',
      path: {
        'course_id': courseId,
        'id': id,
      },
      body: requestBody,
      mediaType: 'application/json',
    });
  }

  /**
   * API ViewSet for all interactions with course accesses.
   *
   * GET /api/courses/<course_id|course_code>/accesses/:<course_access_id>
   * Return list of all course accesses related to the logged-in user or one
   * course access if an id is provided.
   *
   * POST /api/courses/<course_id|course_code>/accesses/ with expected data:
   * - user: str
   * - role: str [owner|admin|member]
   * Return newly created course access
   *
   * PUT /api/courses/<course_id|course_code>/accesses/<course_access_id>/ with expected data:
   * - role: str [owner|admin|member]
   * Return updated course access
   *
   * PATCH /api/courses/<course_id|course_code>/accesses/<course_access_id>/ with expected data:
   * - role: str [owner|admin|member]
   * Return partially updated course access
   *
   * DELETE /api/courses/<course_id|course_code>/accesses/<course_access_id>/
   * Delete targeted course access
   * @param courseId
   * @param id
   * @returns void
   * @throws ApiError
   */
  public coursesAccessesDestroy(
    courseId: string,
    id: string,
  ): CancelablePromise<void> {
    return this.httpRequest.request({
      method: 'DELETE',
      url: '/api/v1.0/courses/{course_id}/accesses/{id}/',
      path: {
        'course_id': courseId,
        'id': id,
      },
    });
  }

  /**
   * Nested Contract Viewset inside course route.
   * It allows to list & retrieve course's contracts if the user is an administrator
   * or an owner of the contract's organization.
   *
   * GET /api/courses/<course_id|course_code>/contracts/
   * Return list of all course's contracts
   *
   * GET /api/courses/<course_id|course_code>/contracts/<contract_id>/
   * Return a course's contract if one matches the provided id
   * @param courseId
   * @param courseId
   * @param courseProductRelationId
   * @param id primary key for the record as UUID
   * @param organizationId
   * @param page A page number within the paginated result set.
   * @param pageSize Number of results to return per page.
   * @param productId
   * @param signatureState * `unsigned` - Unsigned
   * * `half_signed` - Partially signed
   * * `signed` - Signed
   * @returns PaginatedContractList
   * @throws ApiError
   */
  public coursesContractsList(
    courseId: string,
    courseId?: string,
    courseProductRelationId?: string,
    id?: Array<string>,
    organizationId?: string,
    page?: number,
    pageSize?: number,
    productId?: string,
    signatureState?: 'half_signed' | 'signed' | 'unsigned',
  ): CancelablePromise<PaginatedContractList> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/api/v1.0/courses/{course_id}/contracts/',
      path: {
        'course_id': courseId,
      },
      query: {
        'course_id': courseId,
        'course_product_relation_id': courseProductRelationId,
        'id': id,
        'organization_id': organizationId,
        'page': page,
        'page_size': pageSize,
        'product_id': productId,
        'signature_state': signatureState,
      },
    });
  }

  /**
   * Nested Contract Viewset inside course route.
   * It allows to list & retrieve course's contracts if the user is an administrator
   * or an owner of the contract's organization.
   *
   * GET /api/courses/<course_id|course_code>/contracts/
   * Return list of all course's contracts
   *
   * GET /api/courses/<course_id|course_code>/contracts/<contract_id>/
   * Return a course's contract if one matches the provided id
   * @param courseId
   * @param id
   * @returns Contract
   * @throws ApiError
   */
  public coursesContractsRetrieve(
    courseId: string,
    id: string,
  ): CancelablePromise<Contract> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/api/v1.0/courses/{course_id}/contracts/{id}/',
      path: {
        'course_id': courseId,
        'id': id,
      },
    });
  }

  /**
   * API ViewSet for all interactions with course runs.
   * @param courseId
   * @param page A page number within the paginated result set.
   * @param pageSize Number of results to return per page.
   * @returns PaginatedCourseRunList
   * @throws ApiError
   */
  public coursesCourseRunsList(
    courseId: string,
    page?: number,
    pageSize?: number,
  ): CancelablePromise<PaginatedCourseRunList> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/api/v1.0/courses/{course_id}/course-runs/',
      path: {
        'course_id': courseId,
      },
      query: {
        'page': page,
        'page_size': pageSize,
      },
    });
  }

  /**
   * API ViewSet for all interactions with course runs.
   * @param courseId
   * @param id
   * @returns CourseRun
   * @throws ApiError
   */
  public coursesCourseRunsRetrieve(
    courseId: string,
    id: string,
  ): CancelablePromise<CourseRun> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/api/v1.0/courses/{course_id}/course-runs/{id}/',
      path: {
        'course_id': courseId,
        'id': id,
      },
    });
  }

  /**
   * Nested Order Viewset inside Course's routes. It allows to list all users who made
   * 'validated' orders on a given course. You should add some query parameters to filter
   * the list by organization, by product or by course product relation id.
   *
   * GET /api/courses/<course_id>/orders/
   * Returns every users who made an order on a given course.
   *
   * GET /api/courses/<course_id>/orders/?organization_id=<organization_id>>
   * Returns every users who made an order on a course from a specific organization.
   *
   * GET /api/courses/<course_id>/orders/?product_id=<product_id>
   * Returns every users who made an order on the product's course.
   *
   * GET /api/courses/<course_id>/orders/?organization_id=<organization_id>&product_id=<product_id>
   * Returns every users that is attached to a product's course and an organization.
   *
   * GET /api/courses/<course_id>/orders/?course_product_relation_id=<relation_id>
   * Returns every users who made order on the course product relation object.
   * @param courseId
   * @param courseProductRelationId
   * @param organizationId
   * @param page A page number within the paginated result set.
   * @param pageSize Number of results to return per page.
   * @param productId
   * @returns PaginatedNestedOrderCourseList
   * @throws ApiError
   */
  public coursesOrdersList(
    courseId: string,
    courseProductRelationId?: string,
    organizationId?: string,
    page?: number,
    pageSize?: number,
    productId?: string,
  ): CancelablePromise<PaginatedNestedOrderCourseList> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/api/v1.0/courses/{course_id}/orders/',
      path: {
        'course_id': courseId,
      },
      query: {
        'course_product_relation_id': courseProductRelationId,
        'organization_id': organizationId,
        'page': page,
        'page_size': pageSize,
        'product_id': productId,
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
   * @param courseId
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
  public coursesProductsList(
    courseId: string,
    page?: number,
    pageSize?: number,
    productType?: Array<'certificate' | 'credential' | 'enrollment'>,
    productTypeExclude?: Array<'certificate' | 'credential' | 'enrollment'>,
    query?: string,
  ): CancelablePromise<PaginatedCourseProductRelationList> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/api/v1.0/courses/{course_id}/products/',
      path: {
        'course_id': courseId,
      },
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
   * @param courseId
   * @param pkOrProductId
   * @returns CourseProductRelation
   * @throws ApiError
   */
  public coursesProductsRetrieve(
    courseId: string,
    pkOrProductId: string,
  ): CancelablePromise<CourseProductRelation> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/api/v1.0/courses/{course_id}/products/{pk_or_product_id}/',
      path: {
        'course_id': courseId,
        'pk_or_product_id': pkOrProductId,
      },
    });
  }

  /**
   * API ViewSet for all interactions with courses.
   *
   * GET /api/courses/
   * Return list of all courses related to the logged-in user.
   *
   * GET /api/courses/:<course_id|course_code>
   * Return one course if an id is provided.
   *
   * GET /api/courses/:<course_id|course_code>/wish
   * Return wish status on this course for the authenticated user
   *
   * POST /api/courses/:<course_id|course_code>/wish
   * Confirm a wish on this course for the authenticated user
   *
   * DELETE /api/courses/:<course_id|course_code>/wish
   * Delete any existing wish on this course for the authenticated user
   * @param id
   * @returns Course
   * @throws ApiError
   */
  public coursesRetrieve(
    id: string,
  ): CancelablePromise<Course> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/api/v1.0/courses/{id}/',
      path: {
        'id': id,
      },
    });
  }

  /**
   * Action to handle the wish on this course for the logged-in user.
   * @param id
   * @returns Course
   * @throws ApiError
   */
  public coursesWishRetrieve(
    id: string,
  ): CancelablePromise<Course> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/api/v1.0/courses/{id}/wish/',
      path: {
        'id': id,
      },
    });
  }

  /**
   * Action to handle the wish on this course for the logged-in user.
   * @param id
   * @param requestBody
   * @returns Course
   * @throws ApiError
   */
  public coursesWishCreate(
    id: string,
    requestBody: CourseRequest,
  ): CancelablePromise<Course> {
    return this.httpRequest.request({
      method: 'POST',
      url: '/api/v1.0/courses/{id}/wish/',
      path: {
        'id': id,
      },
      body: requestBody,
      mediaType: 'application/json',
    });
  }

  /**
   * Action to handle the wish on this course for the logged-in user.
   * @param id
   * @returns void
   * @throws ApiError
   */
  public coursesWishDestroy(
    id: string,
  ): CancelablePromise<void> {
    return this.httpRequest.request({
      method: 'DELETE',
      url: '/api/v1.0/courses/{id}/wish/',
      path: {
        'id': id,
      },
    });
  }

}

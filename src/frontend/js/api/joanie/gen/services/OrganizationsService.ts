/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Contract } from '../models/Contract';
import type { Course } from '../models/Course';
import type { CourseProductRelation } from '../models/CourseProductRelation';
import type { CourseRequest } from '../models/CourseRequest';
import type { Organization } from '../models/Organization';
import type { OrganizationAccess } from '../models/OrganizationAccess';
import type { OrganizationAccessRequest } from '../models/OrganizationAccessRequest';
import type { PaginatedContractList } from '../models/PaginatedContractList';
import type { PaginatedCourseList } from '../models/PaginatedCourseList';
import type { PaginatedCourseProductRelationList } from '../models/PaginatedCourseProductRelationList';
import type { PaginatedOrganizationAccessList } from '../models/PaginatedOrganizationAccessList';
import type { PaginatedOrganizationList } from '../models/PaginatedOrganizationList';
import type { PatchedOrganizationAccessRequest } from '../models/PatchedOrganizationAccessRequest';

import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';

export class OrganizationsService {

  constructor(public readonly httpRequest: BaseHttpRequest) {}

  /**
   * API ViewSet for all interactions with organizations.
   *
   * GET /api/organizations/:organization_id
   * Return list of all organizations related to the logged-in user or one organization
   * if an id is provided.
   * @param courseProductRelationId
   * @param page A page number within the paginated result set.
   * @param pageSize Number of results to return per page.
   * @returns PaginatedOrganizationList
   * @throws ApiError
   */
  public organizationsList(
    courseProductRelationId?: string,
    page?: number,
    pageSize?: number,
  ): CancelablePromise<PaginatedOrganizationList> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/api/v1.0/organizations/',
      query: {
        'course_product_relation_id': courseProductRelationId,
        'page': page,
        'page_size': pageSize,
      },
    });
  }

  /**
   * API ViewSet for all interactions with organization accesses.
   *
   * GET /api/organization/<organization_id>/accesses/:<organization_access_id>
   * Return list of all organization accesses related to the logged-in user or one
   * organization access if an id is provided.
   *
   * POST /api/<organization_id>/accesses/ with expected data:
   * - user: str
   * - role: str [owner|admin|member]
   * Return newly created organization access
   *
   * PUT /api/<organization_id>/accesses/<organization_access_id>/ with expected data:
   * - role: str [owner|admin|member]
   * Return updated organization access
   *
   * PATCH /api/<organization_id>/accesses/<organization_access_id>/ with expected data:
   * - role: str [owner|admin|member]
   * Return partially updated organization access
   *
   * DELETE /api/<organization_id>/accesses/<organization_access_id>/
   * Delete targeted organization access
   * @param organizationId
   * @param page A page number within the paginated result set.
   * @param pageSize Number of results to return per page.
   * @returns PaginatedOrganizationAccessList
   * @throws ApiError
   */
  public organizationsAccessesList(
    organizationId: string,
    page?: number,
    pageSize?: number,
  ): CancelablePromise<PaginatedOrganizationAccessList> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/api/v1.0/organizations/{organization_id}/accesses/',
      path: {
        'organization_id': organizationId,
      },
      query: {
        'page': page,
        'page_size': pageSize,
      },
    });
  }

  /**
   * API ViewSet for all interactions with organization accesses.
   *
   * GET /api/organization/<organization_id>/accesses/:<organization_access_id>
   * Return list of all organization accesses related to the logged-in user or one
   * organization access if an id is provided.
   *
   * POST /api/<organization_id>/accesses/ with expected data:
   * - user: str
   * - role: str [owner|admin|member]
   * Return newly created organization access
   *
   * PUT /api/<organization_id>/accesses/<organization_access_id>/ with expected data:
   * - role: str [owner|admin|member]
   * Return updated organization access
   *
   * PATCH /api/<organization_id>/accesses/<organization_access_id>/ with expected data:
   * - role: str [owner|admin|member]
   * Return partially updated organization access
   *
   * DELETE /api/<organization_id>/accesses/<organization_access_id>/
   * Delete targeted organization access
   * @param organizationId
   * @param requestBody
   * @returns OrganizationAccess
   * @throws ApiError
   */
  public organizationsAccessesCreate(
    organizationId: string,
    requestBody: OrganizationAccessRequest,
  ): CancelablePromise<OrganizationAccess> {
    return this.httpRequest.request({
      method: 'POST',
      url: '/api/v1.0/organizations/{organization_id}/accesses/',
      path: {
        'organization_id': organizationId,
      },
      body: requestBody,
      mediaType: 'application/json',
    });
  }

  /**
   * API ViewSet for all interactions with organization accesses.
   *
   * GET /api/organization/<organization_id>/accesses/:<organization_access_id>
   * Return list of all organization accesses related to the logged-in user or one
   * organization access if an id is provided.
   *
   * POST /api/<organization_id>/accesses/ with expected data:
   * - user: str
   * - role: str [owner|admin|member]
   * Return newly created organization access
   *
   * PUT /api/<organization_id>/accesses/<organization_access_id>/ with expected data:
   * - role: str [owner|admin|member]
   * Return updated organization access
   *
   * PATCH /api/<organization_id>/accesses/<organization_access_id>/ with expected data:
   * - role: str [owner|admin|member]
   * Return partially updated organization access
   *
   * DELETE /api/<organization_id>/accesses/<organization_access_id>/
   * Delete targeted organization access
   * @param id
   * @param organizationId
   * @returns OrganizationAccess
   * @throws ApiError
   */
  public organizationsAccessesRetrieve(
    id: string,
    organizationId: string,
  ): CancelablePromise<OrganizationAccess> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/api/v1.0/organizations/{organization_id}/accesses/{id}/',
      path: {
        'id': id,
        'organization_id': organizationId,
      },
    });
  }

  /**
   * API ViewSet for all interactions with organization accesses.
   *
   * GET /api/organization/<organization_id>/accesses/:<organization_access_id>
   * Return list of all organization accesses related to the logged-in user or one
   * organization access if an id is provided.
   *
   * POST /api/<organization_id>/accesses/ with expected data:
   * - user: str
   * - role: str [owner|admin|member]
   * Return newly created organization access
   *
   * PUT /api/<organization_id>/accesses/<organization_access_id>/ with expected data:
   * - role: str [owner|admin|member]
   * Return updated organization access
   *
   * PATCH /api/<organization_id>/accesses/<organization_access_id>/ with expected data:
   * - role: str [owner|admin|member]
   * Return partially updated organization access
   *
   * DELETE /api/<organization_id>/accesses/<organization_access_id>/
   * Delete targeted organization access
   * @param id
   * @param organizationId
   * @param requestBody
   * @returns OrganizationAccess
   * @throws ApiError
   */
  public organizationsAccessesUpdate(
    id: string,
    organizationId: string,
    requestBody: OrganizationAccessRequest,
  ): CancelablePromise<OrganizationAccess> {
    return this.httpRequest.request({
      method: 'PUT',
      url: '/api/v1.0/organizations/{organization_id}/accesses/{id}/',
      path: {
        'id': id,
        'organization_id': organizationId,
      },
      body: requestBody,
      mediaType: 'application/json',
    });
  }

  /**
   * API ViewSet for all interactions with organization accesses.
   *
   * GET /api/organization/<organization_id>/accesses/:<organization_access_id>
   * Return list of all organization accesses related to the logged-in user or one
   * organization access if an id is provided.
   *
   * POST /api/<organization_id>/accesses/ with expected data:
   * - user: str
   * - role: str [owner|admin|member]
   * Return newly created organization access
   *
   * PUT /api/<organization_id>/accesses/<organization_access_id>/ with expected data:
   * - role: str [owner|admin|member]
   * Return updated organization access
   *
   * PATCH /api/<organization_id>/accesses/<organization_access_id>/ with expected data:
   * - role: str [owner|admin|member]
   * Return partially updated organization access
   *
   * DELETE /api/<organization_id>/accesses/<organization_access_id>/
   * Delete targeted organization access
   * @param id
   * @param organizationId
   * @param requestBody
   * @returns OrganizationAccess
   * @throws ApiError
   */
  public organizationsAccessesPartialUpdate(
    id: string,
    organizationId: string,
    requestBody?: PatchedOrganizationAccessRequest,
  ): CancelablePromise<OrganizationAccess> {
    return this.httpRequest.request({
      method: 'PATCH',
      url: '/api/v1.0/organizations/{organization_id}/accesses/{id}/',
      path: {
        'id': id,
        'organization_id': organizationId,
      },
      body: requestBody,
      mediaType: 'application/json',
    });
  }

  /**
   * API ViewSet for all interactions with organization accesses.
   *
   * GET /api/organization/<organization_id>/accesses/:<organization_access_id>
   * Return list of all organization accesses related to the logged-in user or one
   * organization access if an id is provided.
   *
   * POST /api/<organization_id>/accesses/ with expected data:
   * - user: str
   * - role: str [owner|admin|member]
   * Return newly created organization access
   *
   * PUT /api/<organization_id>/accesses/<organization_access_id>/ with expected data:
   * - role: str [owner|admin|member]
   * Return updated organization access
   *
   * PATCH /api/<organization_id>/accesses/<organization_access_id>/ with expected data:
   * - role: str [owner|admin|member]
   * Return partially updated organization access
   *
   * DELETE /api/<organization_id>/accesses/<organization_access_id>/
   * Delete targeted organization access
   * @param id
   * @param organizationId
   * @returns void
   * @throws ApiError
   */
  public organizationsAccessesDestroy(
    id: string,
    organizationId: string,
  ): CancelablePromise<void> {
    return this.httpRequest.request({
      method: 'DELETE',
      url: '/api/v1.0/organizations/{organization_id}/accesses/{id}/',
      path: {
        'id': id,
        'organization_id': organizationId,
      },
    });
  }

  /**
   * Nested Contract Viewset inside organization route.
   * It allows to list & retrieve organization's contracts if the user is
   * an administrator or an owner of the organization.
   *
   * GET /api/courses/<organization_id|organization_code>/contracts/
   * Return list of all organization's contracts
   *
   * GET /api/courses/<organization_id|organization_code>/contracts/<contract_id>/
   * Return an organization's contract if one matches the provided id
   * @param organizationId
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
  public organizationsContractsList(
    organizationId: string,
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
      url: '/api/v1.0/organizations/{organization_id}/contracts/',
      path: {
        'organization_id': organizationId,
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
   * Nested Contract Viewset inside organization route.
   * It allows to list & retrieve organization's contracts if the user is
   * an administrator or an owner of the organization.
   *
   * GET /api/courses/<organization_id|organization_code>/contracts/
   * Return list of all organization's contracts
   *
   * GET /api/courses/<organization_id|organization_code>/contracts/<contract_id>/
   * Return an organization's contract if one matches the provided id
   * @param id
   * @param organizationId
   * @returns Contract
   * @throws ApiError
   */
  public organizationsContractsRetrieve(
    id: string,
    organizationId: string,
  ): CancelablePromise<Contract> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/api/v1.0/organizations/{organization_id}/contracts/{id}/',
      path: {
        'id': id,
        'organization_id': organizationId,
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
   * @param organizationId
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
  public organizationsCourseProductRelationsList(
    organizationId: string,
    page?: number,
    pageSize?: number,
    productType?: Array<'certificate' | 'credential' | 'enrollment'>,
    productTypeExclude?: Array<'certificate' | 'credential' | 'enrollment'>,
    query?: string,
  ): CancelablePromise<PaginatedCourseProductRelationList> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/api/v1.0/organizations/{organization_id}/course-product-relations/',
      path: {
        'organization_id': organizationId,
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
   * @param organizationId
   * @param pkOrProductId
   * @returns CourseProductRelation
   * @throws ApiError
   */
  public organizationsCourseProductRelationsRetrieve(
    organizationId: string,
    pkOrProductId: string,
  ): CancelablePromise<CourseProductRelation> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/api/v1.0/organizations/{organization_id}/course-product-relations/{pk_or_product_id}/',
      path: {
        'organization_id': organizationId,
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
   * @param organizationId
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
  public organizationsCoursesList(
    organizationId: string,
    hasListedCourseRuns?: boolean,
    page?: number,
    pageSize?: number,
    productType?: 'certificate' | 'credential' | 'enrollment',
    query?: string,
  ): CancelablePromise<PaginatedCourseList> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/api/v1.0/organizations/{organization_id}/courses/',
      path: {
        'organization_id': organizationId,
      },
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
   * @param organizationId
   * @returns Course
   * @throws ApiError
   */
  public organizationsCoursesRetrieve(
    id: string,
    organizationId: string,
  ): CancelablePromise<Course> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/api/v1.0/organizations/{organization_id}/courses/{id}/',
      path: {
        'id': id,
        'organization_id': organizationId,
      },
    });
  }

  /**
   * Action to handle the wish on this course for the logged-in user.
   * @param id
   * @param organizationId
   * @returns Course
   * @throws ApiError
   */
  public organizationsCoursesWishRetrieve(
    id: string,
    organizationId: string,
  ): CancelablePromise<Course> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/api/v1.0/organizations/{organization_id}/courses/{id}/wish/',
      path: {
        'id': id,
        'organization_id': organizationId,
      },
    });
  }

  /**
   * Action to handle the wish on this course for the logged-in user.
   * @param id
   * @param organizationId
   * @param requestBody
   * @returns Course
   * @throws ApiError
   */
  public organizationsCoursesWishCreate(
    id: string,
    organizationId: string,
    requestBody: CourseRequest,
  ): CancelablePromise<Course> {
    return this.httpRequest.request({
      method: 'POST',
      url: '/api/v1.0/organizations/{organization_id}/courses/{id}/wish/',
      path: {
        'id': id,
        'organization_id': organizationId,
      },
      body: requestBody,
      mediaType: 'application/json',
    });
  }

  /**
   * Action to handle the wish on this course for the logged-in user.
   * @param id
   * @param organizationId
   * @returns void
   * @throws ApiError
   */
  public organizationsCoursesWishDestroy(
    id: string,
    organizationId: string,
  ): CancelablePromise<void> {
    return this.httpRequest.request({
      method: 'DELETE',
      url: '/api/v1.0/organizations/{organization_id}/courses/{id}/wish/',
      path: {
        'id': id,
        'organization_id': organizationId,
      },
    });
  }

  /**
   * API ViewSet for all interactions with organizations.
   *
   * GET /api/organizations/:organization_id
   * Return list of all organizations related to the logged-in user or one organization
   * if an id is provided.
   * @param id
   * @returns Organization
   * @throws ApiError
   */
  public organizationsRetrieve(
    id: string,
  ): CancelablePromise<Organization> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/api/v1.0/organizations/{id}/',
      path: {
        'id': id,
      },
    });
  }

  /**
   * Return an invitation link to sign all the available contracts for the organization.
   * @param id
   * @param contractIds List of contract ids to sign, if not provided all the available contracts will be signed.
   * @param courseProductRelationIds List of course product relation ids to sign related contracts, if not provided all the available contracts will be signed.
   * @returns Organization
   * @throws ApiError
   */
  public organizationsContractsSignatureLinkRetrieve(
    id: string,
    contractIds?: Array<string>,
    courseProductRelationIds?: Array<string>,
  ): CancelablePromise<Organization> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/api/v1.0/organizations/{id}/contracts-signature-link/',
      path: {
        'id': id,
      },
      query: {
        'contract_ids': contractIds,
        'course_product_relation_ids': courseProductRelationIds,
      },
    });
  }

}

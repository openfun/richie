/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Contract } from '../models/Contract';
import type { PaginatedContractList } from '../models/PaginatedContractList';

import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';

export class ContractsService {

  constructor(public readonly httpRequest: BaseHttpRequest) {}

  /**
   * Contract Viewset to list & retrieve contracts owned by the authenticated user.
   *
   * GET /api/contracts/
   * Return list of all contracts owned by the logged-in user.
   *
   * GET /api/contracts/<contract_id>/
   * Return a contract if one matches the provided id,
   * and it is owned by the logged-in user.
   *
   * GET /api/contracts/<contract_id>/download/
   * Return a contract in PDF format when it is signed on.
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
  public contractsList(
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
      url: '/api/v1.0/contracts/',
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
   * Contract Viewset to list & retrieve contracts owned by the authenticated user.
   *
   * GET /api/contracts/
   * Return list of all contracts owned by the logged-in user.
   *
   * GET /api/contracts/<contract_id>/
   * Return a contract if one matches the provided id,
   * and it is owned by the logged-in user.
   *
   * GET /api/contracts/<contract_id>/download/
   * Return a contract in PDF format when it is signed on.
   * @param id
   * @returns Contract
   * @throws ApiError
   */
  public contractsRetrieve(
    id: string,
  ): CancelablePromise<Contract> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/api/v1.0/contracts/{id}/',
      path: {
        'id': id,
      },
    });
  }

  /**
   * Return the PDF file in bytes fully signed to download from the signature provider.
   * @param id
   * @returns binary
   * @throws ApiError
   */
  public contractsDownloadRetrieve(
    id: string,
  ): CancelablePromise<Blob> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/api/v1.0/contracts/{id}/download/',
      path: {
        'id': id,
      },
    });
  }

  /**
   * This endpoint is exclusive to users that have access rights on a specific organization.
   *
   * It triggers the generation of a ZIP archive if the requesting has the correct access rights
   * on the organization. If a course product relation UUID is given from key word arguments,
   * the user requires to have access to the organization that is attached to the specific
   * course product relation object.
   * We return in the response the URL for polling the ZIP archive once it has been generated.
   *
   * Notes on possible `kwargs` as input parameters :
   * - string of an Organization UUID
   * OR
   * - string of an CourseProductRelation UUID
   * @returns Contract
   * @throws ApiError
   */
  public contractsZipArchiveCreate(): CancelablePromise<Contract> {
    return this.httpRequest.request({
      method: 'POST',
      url: '/api/v1.0/contracts/zip-archive/',
    });
  }

  /**
   * Return the ZIP archive once it has been generated and it exists into storages.
   *
   * When the ZIP archive is not ready yet, we will return a response with the status code 404
   * until the ZIP is available to be served. Once available, we return the ZIP archive.
   * If the paired User UUID and the received ZIP UUID do not match any files in storage,
   * it return a response with the status code 404.
   * You must add the ZIP id as a payload.
   * @param zipId
   * @returns Contract
   * @throws ApiError
   */
  public contractsZipArchiveRetrieve(
    zipId: string,
  ): CancelablePromise<Contract> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/api/v1.0/contracts/zip-archive/{zip_id}/',
      path: {
        'zip_id': zipId,
      },
    });
  }

}

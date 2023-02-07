/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Certificate } from '../models/Certificate';
import type { PaginatedCertificateList } from '../models/PaginatedCertificateList';

import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';

export class CertificatesService {

  constructor(public readonly httpRequest: BaseHttpRequest) {}

  /**
   * API views to get all certificates for a user
   *
   * GET /api/certificates/:certificate_id
   * Return list of all certificates for a user or one certificate if an id is
   * provided.
   *
   * GET /api/certificates/:certificate_id/download
   * Return the certificate document in PDF format.
   * @param page A page number within the paginated result set.
   * @param pageSize Number of results to return per page.
   * @returns PaginatedCertificateList
   * @throws ApiError
   */
  public certificatesList(
    page?: number,
    pageSize?: number,
  ): CancelablePromise<PaginatedCertificateList> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/api/v1.0/certificates/',
      query: {
        'page': page,
        'page_size': pageSize,
      },
    });
  }

  /**
   * API views to get all certificates for a user
   *
   * GET /api/certificates/:certificate_id
   * Return list of all certificates for a user or one certificate if an id is
   * provided.
   *
   * GET /api/certificates/:certificate_id/download
   * Return the certificate document in PDF format.
   * @param id
   * @returns Certificate
   * @throws ApiError
   */
  public certificatesRetrieve(
    id: string,
  ): CancelablePromise<Certificate> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/api/v1.0/certificates/{id}/',
      path: {
        'id': id,
      },
    });
  }

  /**
   * Retrieve a certificate through its id if it is owned by the authenticated user.
   * @param id
   * @returns binary
   * @throws ApiError
   */
  public certificatesDownloadRetrieve(
    id: string,
  ): CancelablePromise<Blob> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/api/v1.0/certificates/{id}/download/',
      path: {
        'id': id,
      },
    });
  }

}

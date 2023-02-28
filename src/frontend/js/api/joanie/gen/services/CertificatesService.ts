/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Certificate } from '../models/Certificate';

import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';

export class CertificatesService {

  constructor(public readonly httpRequest: BaseHttpRequest) {}

  /**
   * API views to get all certificates for a user
   * GET /api/certificates/:certificate_id
   * Return list of all certificates for a user or one certificate if an id is
   * provided.
   *
   * GET /api/certificates/:certificate_id/download
   * Return the certificate document in PDF format.
   * @param page A page number within the paginated result set.
   * @returns any
   * @throws ApiError
   */
  public certificatesList(
    page?: number,
  ): CancelablePromise<{
    count: number;
    next?: string | null;
    previous?: string | null;
    results: Array<Certificate>;
  }> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/certificates/',
      query: {
        'page': page,
      },
    });
  }

  /**
   * API views to get all certificates for a user
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
  public certificatesRead(
    id: string,
  ): CancelablePromise<Certificate> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/certificates/{id}/',
      path: {
        'id': id,
      },
    });
  }

  /**
   * Retrieve a certificate through its id if it is owned by the authenticated user.
   * @param id
   * @returns Certificate
   * @throws ApiError
   */
  public certificatesDownload(
    id: string,
  ): CancelablePromise<Certificate> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/certificates/{id}/download/',
      path: {
        'id': id,
      },
    });
  }

}

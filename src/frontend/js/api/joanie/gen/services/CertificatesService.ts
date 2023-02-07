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
   * @returns Certificate
   * @throws ApiError
   */
  public certificatesList(): CancelablePromise<Array<Certificate>> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/certificates/',
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

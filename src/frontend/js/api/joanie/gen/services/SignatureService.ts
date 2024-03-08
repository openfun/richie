/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';

export class SignatureService {

  constructor(public readonly httpRequest: BaseHttpRequest) {}

  /**
   * The webhook called by the signature provider when a file has been signed/refused.
   * @returns any No response body
   * @throws ApiError
   */
  public signatureNotificationsCreate(): CancelablePromise<any> {
    return this.httpRequest.request({
      method: 'POST',
      url: '/api/v1.0/signature/notifications/',
    });
  }

}

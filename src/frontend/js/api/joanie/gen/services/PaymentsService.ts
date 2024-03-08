/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';

export class PaymentsService {

  constructor(public readonly httpRequest: BaseHttpRequest) {}

  /**
   * The webhook called by payment provider
   * when a payment has been created/updated/refunded...
   * @returns any No response body
   * @throws ApiError
   */
  public paymentsNotificationsCreate(): CancelablePromise<any> {
    return this.httpRequest.request({
      method: 'POST',
      url: '/api/v1.0/payments/notifications/',
    });
  }

}

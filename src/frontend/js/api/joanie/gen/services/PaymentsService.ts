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
   * @returns any
   * @throws ApiError
   */
  public paymentsNotificationsCreate(): CancelablePromise<any> {
    return this.httpRequest.request({
      method: 'POST',
      url: '/payments/notifications/',
    });
  }

}

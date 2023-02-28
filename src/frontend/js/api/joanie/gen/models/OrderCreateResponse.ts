/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { Payment } from './Payment';

export type OrderCreateResponse = {
  course: string;
  /**
   * date and time at which a record was created
   */
  readonly created_on?: string;
  readonly certificate?: string;
  readonly enrollments?: string;
  id: string;
  readonly main_invoice?: string;
  organization?: string;
  readonly owner?: string;
  readonly total?: number;
  readonly total_currency?: string;
  product: string;
  readonly state?: OrderCreateResponse.state;
  readonly target_courses?: string;
  payment_info?: Payment;
};

export namespace OrderCreateResponse {

  export enum state {
    PENDING = 'pending',
    CANCELED = 'canceled',
    FAILED = 'failed',
    VALIDATED = 'validated',
  }


}


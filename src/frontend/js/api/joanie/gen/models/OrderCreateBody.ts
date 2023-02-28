/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { Address } from './Address';

export type OrderCreateBody = {
  course: string;
  /**
   * date and time at which a record was created
   */
  readonly created_on?: string;
  readonly certificate?: string;
  readonly enrollments?: string;
  readonly id?: string;
  readonly main_invoice?: string;
  organization?: string;
  readonly owner?: string;
  readonly total?: number;
  readonly total_currency?: string;
  product: string;
  readonly state?: OrderCreateBody.state;
  readonly target_courses?: string;
  billing_address?: Address;
};

export namespace OrderCreateBody {

  export enum state {
    PENDING = 'pending',
    CANCELED = 'canceled',
    FAILED = 'failed',
    VALIDATED = 'validated',
  }


}


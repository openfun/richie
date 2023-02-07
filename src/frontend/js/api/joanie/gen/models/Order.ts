/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

export type Order = {
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
  readonly state?: Order.state;
  readonly target_courses?: string;
};

export namespace Order {

  export enum state {
    PENDING = 'pending',
    CANCELED = 'canceled',
    FAILED = 'failed',
    VALIDATED = 'validated',
  }


}


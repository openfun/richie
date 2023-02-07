/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { CertificationDefinition } from './CertificationDefinition';

export type Product = {
  readonly call_to_action?: string;
  certificate?: CertificationDefinition;
  readonly id?: string;
  readonly organizations?: string;
  readonly price?: number;
  readonly price_currency?: string;
  readonly target_courses?: string;
  readonly title?: string;
  readonly type?: Product.type;
};

export namespace Product {

  export enum type {
    CREDENTIAL = 'credential',
    ENROLLMENT = 'enrollment',
    CERTIFICATE = 'certificate',
  }


}


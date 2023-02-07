/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { CertificationDefinition } from './CertificationDefinition';
import type { NestedOrder } from './NestedOrder';

/**
 * Certificate model serializer
 */
export type Certificate = {
  readonly id: string;
  readonly certificate_definition: CertificationDefinition;
  readonly issued_on: string;
  readonly order: NestedOrder;
};


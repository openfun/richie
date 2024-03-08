/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { ContractDefinition } from './ContractDefinition';
import type { NestedOrder } from './NestedOrder';
import type { User } from './User';

/**
 * Serializer for Contract model serializer
 */
export type Contract = {
  /**
   * date and time at which a record was created
   */
  readonly created_on: string;
  definition: ContractDefinition;
  readonly id: string;
  order: NestedOrder;
  readonly organization_signatory: User;
  readonly organization_signed_on: string | null;
  readonly student_signed_on: string | null;
};


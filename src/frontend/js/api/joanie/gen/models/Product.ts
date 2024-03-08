/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { CertificationDefinition } from './CertificationDefinition';
import type { ContractDefinition } from './ContractDefinition';
import type { ProductTargetCourseRelation } from './ProductTargetCourseRelation';
import type { TypeEnum } from './TypeEnum';

/**
 * Product serializer including
 * - certificate definition information if there is
 * - contract definition information if there is
 * - targeted courses with its course runs
 * - If user is authenticated, we try to retrieve enrollment related
 * to each course run.
 * - order if user is authenticated
 */
export type Product = {
  readonly call_to_action: string;
  readonly certificate_definition: CertificationDefinition;
  readonly contract_definition: ContractDefinition;
  readonly id: string;
  /**
   * Return the instruction of the instance in html format.
   */
  readonly instructions: string;
  readonly price: number;
  /**
   * Return the code of currency used by the instance
   */
  readonly price_currency: string;
  /**
   * Process the state of the product based on its equivalent course run dates.
   */
  readonly state: string;
  readonly target_courses: Array<ProductTargetCourseRelation>;
  readonly title: string;
  readonly type: TypeEnum;
};


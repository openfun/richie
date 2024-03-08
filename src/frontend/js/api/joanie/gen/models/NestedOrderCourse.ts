/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { ContractLight } from './ContractLight';
import type { DefinitionResourcesProduct } from './DefinitionResourcesProduct';
import type { OrderStateEnum } from './OrderStateEnum';
import type { Organization } from './Organization';
import type { UserLight } from './UserLight';

/**
 * Serializer for orders made on courses.
 */
export type NestedOrderCourse = {
  /**
   * primary key for the record as UUID
   */
  readonly certificate_id: string;
  readonly contract: ContractLight;
  /**
   * primary key for the record as UUID
   */
  readonly course_id: string;
  /**
   * date and time at which a record was created
   */
  readonly created_on: string;
  /**
   * primary key for the record as UUID
   */
  readonly enrollment_id: string;
  readonly id: string;
  readonly organization: Organization;
  readonly owner: UserLight;
  readonly product: DefinitionResourcesProduct;
  readonly state: OrderStateEnum;
};


/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { CourseLight } from './CourseLight';
import type { OrderGroup } from './OrderGroup';
import type { Organization } from './Organization';
import type { Product } from './Product';

/**
 * Serialize a course product relation.
 */
export type CourseProductRelation = {
  readonly course: CourseLight;
  /**
   * date and time at which a record was created
   */
  readonly created_on: string;
  /**
   * primary key for the record as UUID
   */
  readonly id: string;
  readonly order_groups: Array<OrderGroup>;
  readonly organizations: Array<Organization>;
  readonly product: Product;
};


/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { Contract } from './Contract';
import type { CourseLight } from './CourseLight';
import type { EnrollmentLight } from './EnrollmentLight';
import type { OrderStateEnum } from './OrderStateEnum';
import type { OrderTargetCourseRelation } from './OrderTargetCourseRelation';
import type { Organization } from './Organization';

/**
 * Order model serializer
 */
export type Order = {
  /**
   * primary key for the record as UUID
   */
  readonly certificate_id: string;
  readonly contract: Contract;
  readonly course: CourseLight;
  /**
   * date and time at which a record was created
   */
  readonly created_on: string;
  readonly enrollment: EnrollmentLight;
  readonly id: string;
  readonly main_invoice_reference: string;
  /**
   * primary key for the record as UUID
   */
  order_group_id?: string;
  readonly organization: Organization;
  readonly owner: string;
  /**
   * primary key for the record as UUID
   */
  product_id: string;
  readonly state: OrderStateEnum;
  readonly target_courses: Array<OrderTargetCourseRelation>;
  /**
   * For the current order, retrieve its related enrollments.
   */
  readonly target_enrollments: Array<Record<string, any>>;
  readonly total: number;
  /**
   * Return the currency used
   */
  readonly total_currency: string;
};


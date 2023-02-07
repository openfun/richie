/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { CourseRun } from './CourseRun';
import type { EnrollmentStateEnum } from './EnrollmentStateEnum';

/**
 * Enrollment model serializer
 */
export type Enrollment = {
  readonly id: string;
  /**
   * primary key for the record as UUID
   */
  readonly certificate_id: string;
  readonly course_run: CourseRun;
  /**
   * date and time at which a record was created
   */
  readonly created_on: string;
  /**
   * Ticked if the user is enrolled to the course run.
   */
  is_active: boolean;
  /**
   * Get orders pointing to the enrollment.
   */
  readonly orders: Array<Record<string, any>>;
  /**
   * Get products related to the enrollment's course run.
   */
  readonly product_relations: Array<Record<string, any>>;
  readonly state: EnrollmentStateEnum;
  was_created_by_order: boolean;
};


/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { CourseRun } from './CourseRun';
import type { EnrollmentStateEnum } from './EnrollmentStateEnum';

/**
 * Enrollment model light serializer
 */
export type EnrollmentLight = {
  readonly id: string;
  readonly course_run: CourseRun;
  /**
   * date and time at which a record was created
   */
  readonly created_on: string;
  /**
   * Ticked if the user is enrolled to the course run.
   */
  readonly is_active: boolean;
  readonly state: EnrollmentStateEnum;
  was_created_by_order: boolean;
};


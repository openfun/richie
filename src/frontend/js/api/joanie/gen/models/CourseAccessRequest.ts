/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { CourseAccessRoleChoiceEnum } from './CourseAccessRoleChoiceEnum';

/**
 * Serialize course accesses for the API.
 */
export type CourseAccessRequest = {
  role?: CourseAccessRoleChoiceEnum;
  /**
   * primary key for the record as UUID
   */
  user_id: string;
};


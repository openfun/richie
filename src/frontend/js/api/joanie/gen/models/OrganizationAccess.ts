/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { OrganizationAccessRoleChoiceEnum } from './OrganizationAccessRoleChoiceEnum';

/**
 * Serialize Organization accesses for the API.
 */
export type OrganizationAccess = {
  /**
   * primary key for the record as UUID
   */
  readonly id: string;
  role?: OrganizationAccessRoleChoiceEnum;
  /**
   * primary key for the record as UUID
   */
  user_id: string;
};


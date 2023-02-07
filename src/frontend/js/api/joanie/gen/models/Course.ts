/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { Organization } from './Organization';

/**
 * Serialize all non-sensitive course information. This serializer is read only.
 */
export type Course = {
  /**
   * date and time at which a record was created
   */
  readonly created_on: string;
  readonly code: string;
  readonly course_run_ids: Array<string>;
  cover: string;
  /**
   * primary key for the record as UUID
   */
  readonly id: string;
  readonly organizations: Array<Organization>;
  readonly product_ids: Array<string>;
  /**
   * The state of the course carrying information on what to display on a course glimpse.
   *
   * The game is to find the highest priority state for this course among
   * its course runs and its products.
   */
  readonly state: string;
  readonly title: string;
  effort: string;
};


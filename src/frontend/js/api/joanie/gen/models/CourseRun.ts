/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { Course } from './Course';

export type CourseRun = {
  course?: Course;
  readonly end?: string | null;
  readonly enrollment_end?: string | null;
  readonly enrollment_start?: string | null;
  /**
   * primary key for the record as UUID
   */
  readonly id?: string;
  readonly resource_link?: string;
  readonly start?: string | null;
  readonly title?: string;
  readonly state?: string;
};


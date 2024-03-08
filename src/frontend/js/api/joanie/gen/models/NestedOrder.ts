/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { CourseLight } from './CourseLight';
import type { EnrollmentLight } from './EnrollmentLight';
import type { Organization } from './Organization';

/**
 * Order model serializer for the Certificate model
 */
export type NestedOrder = {
  readonly id: string;
  readonly course: CourseLight;
  readonly enrollment: EnrollmentLight;
  readonly organization: Organization;
  /**
   * Return the name full name of the order's owner or fallback to username
   */
  readonly owner_name: string;
  readonly product_title: string;
};


/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { Address } from './Address';

/**
 * Serialize all non-sensitive information about an organization
 */
export type Organization = {
  /**
   * primary key for the record as UUID
   */
  readonly id: string;
  readonly code: string;
  logo: string | null;
  readonly title: string;
  readonly address: Address | null;
  readonly enterprise_code: string | null;
  readonly activity_category_code: string;
  readonly contact_phone: string;
  readonly contact_email: string;
  readonly dpo_email: string;
};


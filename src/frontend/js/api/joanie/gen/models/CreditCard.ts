/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

/**
 * CreditCard Serializer
 */
export type CreditCard = {
  readonly id: string;
  title?: string | null;
  readonly brand: string | null;
  readonly expiration_month: number;
  readonly expiration_year: number;
  readonly last_numbers: string;
  is_main?: boolean;
};


/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { CountryEnum } from './CountryEnum';

/**
 * Address model serializer
 */
export type Address = {
  address: string;
  city: string;
  country: CountryEnum;
  first_name: string;
  last_name: string;
  readonly id: string;
  is_main?: boolean;
  postcode: string;
  title: string;
};

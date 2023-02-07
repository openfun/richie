/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

/**
 * Light serializer for User model.
 */
export type UserLight = {
  /**
   * primary key for the record as UUID
   */
  readonly id: string;
  /**
   * Required. 150 characters or fewer. Letters, digits and @/./+/-/_ only.
   */
  readonly username: string;
  full_name: string;
  readonly email: string;
};


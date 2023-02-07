/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

/**
 * Serializer for User model.
 */
export type User = {
  /**
   * primary key for the record as UUID
   */
  readonly id: string;
  /**
   * Required. 150 characters or fewer. Letters, digits and @/./+/-/_ only.
   */
  readonly username: string;
  full_name: string;
  /**
   * Designates that this user has all permissions without explicitly assigning them.
   */
  readonly is_superuser: boolean;
  /**
   * Designates whether the user can log into this admin site.
   */
  readonly is_staff: boolean;
  /**
   * Return abilities of the logged-in user on itself.
   */
  readonly abilities: Record<string, any>;
};


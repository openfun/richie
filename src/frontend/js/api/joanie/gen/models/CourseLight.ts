/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

/**
 * Serialize all non-sensitive course information. This serializer is read only.
 */
export type CourseLight = {
  readonly code: string;
  cover: string;
  /**
   * primary key for the record as UUID
   */
  readonly id: string;
  readonly title: string;
};


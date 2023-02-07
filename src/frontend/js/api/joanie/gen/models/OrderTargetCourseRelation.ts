/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

/**
 * Serializer for OrderTargetCourseRelation model
 */
export type OrderTargetCourseRelation = {
  /**
   * Return the code of the targeted course
   */
  readonly code: string;
  /**
   * Return all course runs targeted by the order.
   */
  readonly course_runs: Array<Record<string, any>>;
  readonly is_graded: boolean;
  readonly position: number;
  /**
   * Return the title of the targeted course
   */
  readonly title: string;
};


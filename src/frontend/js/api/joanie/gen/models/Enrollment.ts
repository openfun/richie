/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { CourseRun } from './CourseRun';

export type Enrollment = {
  readonly id?: string;
  course_run?: CourseRun;
  /**
   * date and time at which a record was created
   */
  readonly created_on?: string;
  /**
   * Ticked if the user is enrolled to the course run.
   */
  is_active: boolean;
  readonly state?: Enrollment.state;
  was_created_by_order: boolean;
};

export namespace Enrollment {

  export enum state {
    SET = 'set',
    FAILED = 'failed',
  }


}


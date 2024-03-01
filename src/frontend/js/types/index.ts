import { Nullable } from 'types/utils';

export enum CourseStateTextEnum {
  ENROLLMENT_OPENED = 'open for enrollment',
  STARTING_ON = 'starting on',
  ENROLLMENT_CLOSED = 'enrollment closed',
  ON_GOING = 'on-going',
  ARCHIVED = 'archived',
  TO_BE_SCHEDULED = 'to be scheduled',
}

export type StateCTA = 'enroll now' | 'study now' | undefined;

export enum CourseRunDisplayMode {
  COMPACT = 'compact',
  DETAILED = 'detailed',
}

export interface CourseRun {
  id: number;
  resource_link: string;
  start: string;
  end: string;
  enrollment_start: string;
  enrollment_end: string;
  languages: string[];
  state: CourseState;
  dashboard_link: Nullable<string>;
  title?: string;
  snapshot?: string;
  display_mode: CourseRunDisplayMode;
}

export enum Priority {
  ONGOING_OPEN,
  FUTURE_OPEN,
  ARCHIVED_OPEN,
  FUTURE_NOT_YET_OPEN,
  FUTURE_CLOSED,
  ONGOING_CLOSED,
  ARCHIVED_CLOSED,
  TO_BE_SCHEDULED,
}

export interface CourseState {
  priority: Priority;
  datetime: Nullable<string>;
  call_to_action: Nullable<StateCTA>;
  text: CourseStateTextEnum;
}

export interface OpenEdXEnrollment {
  created: Nullable<string>;
  mode: 'audit' | 'honor' | 'verified';
  is_active: boolean;
  course_details: {
    course_id: string;
    course_name: string;
    enrollment_start: Nullable<string>;
    enrollment_end: Nullable<string>;
    course_start: Nullable<string>;
    course_end: Nullable<string>;
    invite_only: boolean;
  };
  user: string;
}

/**
 * Use an unknown type to make sure we do not depend on any LMS-specific fields
 * on enrollment objects, just use HTTP response codes.
 */
export type UnknownEnrollment = unknown;

import { CourseRun, CourseState, CourseStateTextEnum, Priority } from 'types';

const MAX_DATE = new Date(8.64e15);

export const computeStates = (courseRuns: CourseRun[]): CourseRun[] => {
  return courseRuns.map((run) => ({
    ...run,
    state: computeState(run),
  }));
};

export const computeState = (courseRun: CourseRun): CourseState => {
  if (!courseRun.start || !courseRun.enrollment_start) {
    return {
      priority: Priority.TO_BE_SCHEDULED,
      datetime: null,
      call_to_action: null,
      text: CourseStateTextEnum.TO_BE_SCHEDULED,
    };
  }
  const now = new Date();
  const end = courseRun.end ? new Date(courseRun.end) : MAX_DATE;
  const enrollmentEnd = courseRun.enrollment_end ? new Date(courseRun.enrollment_end) : MAX_DATE;

  if (new Date(courseRun.start) < now) {
    if (end > now) {
      if (enrollmentEnd > now) {
        return {
          priority: Priority.ONGOING_OPEN,
          datetime: enrollmentEnd.toISOString(),
          call_to_action: 'enroll now',
          text: CourseStateTextEnum.ON_GOING,
        };
      }
      return {
        priority: Priority.ONGOING_CLOSED,
        datetime: null,
        call_to_action: null,
        text: CourseStateTextEnum.ON_GOING,
      };
    }
    if (new Date(courseRun.enrollment_start) < now && now < enrollmentEnd) {
      return {
        priority: Priority.ARCHIVED_OPEN,
        datetime: enrollmentEnd.toISOString(),
        call_to_action: 'study now',
        text: CourseStateTextEnum.ARCHIVED,
      };
    }
    return {
      priority: Priority.ARCHIVED_CLOSED,
      datetime: null,
      call_to_action: null,
      text: CourseStateTextEnum.ARCHIVED,
    };
  }
  if (new Date(courseRun.enrollment_start) > now) {
    return {
      priority: Priority.FUTURE_NOT_YET_OPEN,
      datetime: courseRun.start,
      call_to_action: null,
      text: CourseStateTextEnum.STARTING_ON,
    };
  }
  if (enrollmentEnd > now) {
    return {
      priority: Priority.FUTURE_OPEN,
      datetime: courseRun.start,
      call_to_action: 'enroll now',
      text: CourseStateTextEnum.STARTING_ON,
    };
  }
  return {
    priority: Priority.FUTURE_CLOSED,
    datetime: courseRun.start,
    call_to_action: null,
    text: CourseStateTextEnum.ENROLLMENT_CLOSED,
  };
};

export const isOpenedCourseRunCredential = (courseRunState: CourseState) =>
  courseRunState.priority <= Priority.FUTURE_NOT_YET_OPEN;

export const isOpenedCourseRunCertificate = (courseRunState: CourseState) =>
  [
    Priority.ONGOING_OPEN,
    Priority.FUTURE_OPEN,
    Priority.FUTURE_NOT_YET_OPEN,
    Priority.FUTURE_CLOSED,
    Priority.ONGOING_CLOSED,
  ].includes(courseRunState.priority);

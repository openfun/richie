import * as Joanie from 'types/Joanie';

export class CoursesHelper {
  static findActiveCourseEnrollmentInOrder(
    targetCourse: Joanie.TargetCourse,
    order: Joanie.OrderLite,
  ) {
    const courseRunIds = targetCourse.course_runs.map(({ id }) => id);
    return order.enrollments.find(({ is_active, course_run }) => {
      return is_active && courseRunIds.includes(course_run.id);
    });
  }
  static findCourseEnrollmentsInOrder(
    targetCourse: Joanie.AbstractCourse,
    order: Joanie.OrderLite,
  ) {
    const courseRunIds = targetCourse.course_runs.map(({ id }) => id);
    return order.enrollments.filter(({ course_run }) => {
      return courseRunIds.includes(course_run.id);
    });
  }
}

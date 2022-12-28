import * as Joanie from '../../types/Joanie';

export class CoursesHelper {
  static findActiveCourseEnrollmentInOrder(
    targetCourse: Joanie.CourseProductTargetCourse,
    order: Joanie.OrderLite,
  ) {
    const resourceLinks = targetCourse.course_runs.map(({ resource_link }) => resource_link);
    return order.enrollments.find(({ is_active, course_run }) => {
      return is_active && resourceLinks.includes(course_run.resource_link);
    });
  }
  static findCourseEnrollmentsInOrder(
    targetCourse: Joanie.CourseProductTargetCourse,
    order: Joanie.OrderLite,
  ) {
    const resourceLinks = targetCourse.course_runs.map(({ resource_link }) => resource_link);
    return order.enrollments.filter(({ course_run }) => {
      return resourceLinks.includes(course_run.resource_link);
    });
  }
}

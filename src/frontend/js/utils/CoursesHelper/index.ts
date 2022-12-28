import * as Joanie from 'types/Joanie';
import { Enrollment } from 'types/Joanie';

export class CoursesHelper {
  static findActiveCourseEnrollmentInOrder(targetCourse: Joanie.TargetCourse, order: Joanie.Order) {
    return CoursesHelper.findActiveEnrollment(targetCourse, order.enrollments);
  }
  static findActiveEnrollment(targetCourse: Joanie.AbstractCourse, enrollments: Enrollment[]) {
    const courseRunIds = targetCourse.course_runs.map(({ id }) => id);
    return enrollments.find(({ is_active, course_run }) => {
      return is_active && courseRunIds.includes(course_run.id);
    });
  }
  static findCourseEnrollmentsInOrder(targetCourse: Joanie.AbstractCourse, order: Joanie.Order) {
    const courseRunIds = targetCourse.course_runs.map(({ id }) => id);
    return order.enrollments.filter(({ course_run }) => {
      return courseRunIds.includes(course_run.id);
    });
  }
}

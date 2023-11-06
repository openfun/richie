import { TargetCourse, AbstractCourse, Enrollment, CredentialOrder } from 'types/Joanie';

export class CoursesHelper {
  static findActiveCourseEnrollmentInOrder(targetCourse: TargetCourse, order: CredentialOrder) {
    return CoursesHelper.findActiveEnrollment(targetCourse, order.target_enrollments);
  }
  static findActiveEnrollment(targetCourse: AbstractCourse, enrollments: Enrollment[]) {
    const courseRunIds = targetCourse.course_runs.map(({ id }) => id);
    return enrollments.find(({ is_active, course_run }) => {
      return is_active && courseRunIds.includes(course_run.id);
    });
  }
  static findCourseEnrollmentsInOrder(targetCourse: AbstractCourse, order: CredentialOrder) {
    const courseRunIds = targetCourse.course_runs.map(({ id }) => id);
    return order.target_enrollments.filter(({ course_run }) => {
      return courseRunIds.includes(course_run.id);
    });
  }
}

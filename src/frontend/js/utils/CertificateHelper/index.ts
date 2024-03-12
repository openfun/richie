import { Certificate } from 'types/Joanie';
import { Nullable } from 'types/utils';

export class CertificateHelper {
  /**
   * Get the course from a Certificate according to its type.
   * Indeed, a Certificate can be linked to an Order or an Enrollment.
   */
  static getCourse(certificate?: Nullable<Certificate>) {
    if (!certificate) return undefined;

    if (certificate.order) {
      if (certificate.order.course) return certificate.order.course;
      else return certificate.order.enrollment.course_run.course;
    }

    return certificate.enrollment.course_run.course;
  }
}

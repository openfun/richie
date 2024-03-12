import {
  CertificateFactory,
  CertificateOrderFactory,
  CourseLightFactory,
  CourseRunFactory,
  CredentialOrderFactory,
  EnrollmentLightFactory,
} from 'utils/test/factories/joanie';
import { CertificateHelper } from '.';

describe('CertificateHelper', () => {
  it.each([undefined, null])(
    'should return undefined if the certificate is not defined',
    (emptyValue) => {
      expect(CertificateHelper.getCourse(emptyValue)).toBeUndefined();
    },
  );

  it.each([
    CertificateFactory({
      enrollment: EnrollmentLightFactory({
        course_run: CourseRunFactory({
          course: CourseLightFactory({ title: 'Course 1' }).one(),
        }).one(),
      }).one(),
      order: null,
    }).one(),
    CertificateFactory({
      enrollment: null,
      order: CredentialOrderFactory({
        course: CourseLightFactory({ title: 'Course 1' }).one(),
      }).one(),
    }).one(),
    CertificateFactory({
      enrollment: null,
      order: CertificateOrderFactory({
        enrollment: EnrollmentLightFactory({
          course_run: CourseRunFactory({
            course: CourseLightFactory({ title: 'Course 1' }).one(),
          }).one(),
        }).one(),
      }).one(),
    }).one(),
  ])('should return the course from the certificate linked to ', (certificate) => {
    expect(CertificateHelper.getCourse(certificate)?.title).toEqual('Course 1');
  });
});

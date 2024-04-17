import {
  CertificateFactory,
  CourseLightFactory,
  CourseRunFactory,
  EnrollmentLightFactory,
  NestedCertificateOrderFactory,
  NestedCredentialOrderFactory,
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
    {
      testLabel: 'for enrollment certificate',
      certificate: CertificateFactory({
        enrollment: EnrollmentLightFactory({
          course_run: CourseRunFactory({
            course: CourseLightFactory({ title: 'Course 1' }).one(),
          }).one(),
        }).one(),
        order: null,
      }).one(),
    },
    {
      testLabel: 'for credential order certificate',
      certificate: CertificateFactory({
        enrollment: null,
        order: NestedCredentialOrderFactory({
          course: CourseLightFactory({ title: 'Course 1' }).one(),
        }).one(),
      }).one(),
    },
    {
      testLabel: 'for certificate order certificate',
      certificate: CertificateFactory({
        enrollment: null,
        order: NestedCertificateOrderFactory({
          enrollment: EnrollmentLightFactory({
            course_run: CourseRunFactory({
              course: CourseLightFactory({ title: 'Course 1' }).one(),
            }).one(),
          }).one(),
        }).one(),
      }).one(),
    },
  ])('should return the course from the certificate linked to $testLabel', ({ certificate }) => {
    expect(CertificateHelper.getCourse(certificate)?.title).toEqual('Course 1');
  });
});

import { User } from 'types/User';
import { Enrollment } from 'types';
import { Maybe, Nullable } from 'types/utils';
import APIHandler from './lms';

const EnrollmentApi = (resourceLink: string) => {
  const LMS = APIHandler(resourceLink);

  return {
    get: async (user: Nullable<User>) => {
      return LMS.enrollment.get(resourceLink, user);
    },
    isEnrolled: async (enrollment: Maybe<Nullable<Enrollment>>) => {
      return LMS.enrollment.isEnrolled(enrollment);
    },
    set: async (user: User) => {
      return LMS.enrollment.set(resourceLink, user);
    },
  };
};

export default EnrollmentApi;

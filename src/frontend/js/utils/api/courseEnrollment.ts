import { User } from 'types/User';
import { Nullable } from 'utils/types';
import APIHandler from './lms';

const EnrollmentApi = {
  get: (url: string, user: Nullable<User>) => {
    const LMS = APIHandler(url);
    return LMS.enrollment.get(url, user);
  },
  isEnrolled: (url: string, user: Nullable<User>) => {
    const LMS = APIHandler(url);
    return LMS.enrollment.isEnrolled(url, user);
  },
  set: (url: string, user: User) => {
    const LMS = APIHandler(url);
    return LMS.enrollment.set(url, user);
  },
};
export default EnrollmentApi;

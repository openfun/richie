import context from 'utils/context';
import { Maybe } from 'types/utils';
import { AuthenticationBackend, LMSBackend } from 'types/commonDataProps';

export const LMS_BACKENDS = context.lms_backends || [];

export const findLmsBackend = (url: string): Maybe<AuthenticationBackend | LMSBackend> => {
  return LMS_BACKENDS.find((lms) => new RegExp(lms.course_regexp).test(url));
};

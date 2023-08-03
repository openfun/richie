import { APIBackend, APILms } from 'types/api';
import APIHandler from './lms';
import JoanieEnrollmentApiInterface from './lms/joanie';
import { findLmsBackend } from './configuration';

const EnrollmentApi = (resourceLink: string): APILms['enrollment'] => {
  const apiConf = findLmsBackend(resourceLink);

  if (apiConf?.backend === APIBackend.JOANIE) {
    return JoanieEnrollmentApiInterface();
  }

  const LMS = APIHandler(resourceLink);
  return LMS.enrollment;
};

export default EnrollmentApi;

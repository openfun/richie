import JoanieApi from 'utils/api/joanie';
import { AuthenticationBackend, LMSBackend } from '../../../types/commonDataProps';
import { APILms } from '../../../types/api';

import { Maybe, Nullable } from '../../../types/utils';
import { User } from '../../../types/User';
import * as Joanie from '../../../types/Joanie';
import { Enrollment } from '../../../types/Joanie';

const JoanieEnrollmentApiInterface = (
  APIConf: AuthenticationBackend | LMSBackend,
): APILms['enrollment'] => {
  const joanieAPI: Joanie.API = JoanieApi();

  const extractCourseRunIdFromUrl = (url: string): Maybe<Nullable<string>> => {
    const matches = url.match((APIConf as LMSBackend).course_regexp);
    return matches && matches[2] ? matches[2] : null;
  };
  return {
    get(url: string) {
      return new Promise((resolve, reject) => {
        const courseRunId = extractCourseRunIdFromUrl(url);
        joanieAPI.user.enrollments
          .get<{ id?: string; course_run: string }>({ course_run: courseRunId as string })
          .then((res) => {
            if (res.count > 0) {
              resolve(res.results[0]);
            } else {
              resolve(null);
            }
          })
          .catch((error) => {
            reject(error);
          });
      });
    },
    async set(
      url: string,
      user: User,
      enrollment: Maybe<Nullable<Enrollment>>,
      isActive = true,
    ): Promise<boolean> {
      const courseRunId = extractCourseRunIdFromUrl(url);
      if (!courseRunId) {
        return new Promise((resolve) => resolve(false));
      }

      return new Promise((resolve, reject) => {
        if (!enrollment) {
          joanieAPI.user.enrollments
            .create({
              course_run: courseRunId,
              is_active: true,
              was_created_by_order: false,
            })
            .then(() => {
              resolve(isActive);
            })
            .catch(() => {
              reject();
            });
        } else {
          joanieAPI.user.enrollments
            .update({
              course_run: courseRunId,
              id: enrollment.id,
              is_active: isActive,
              was_created_by_order: false,
            })
            .then(() => {
              resolve(isActive);
            })
            .catch(() => {
              reject();
            });
        }
      });
    },
    isEnrolled(enrollment: Maybe<Nullable<Enrollment>>): Promise<Maybe<boolean>> {
      return new Promise((resolve) => resolve(!!enrollment?.is_active));
    },
    meta: {
      canUnenroll: true,
    },
  };
};

export default JoanieEnrollmentApiInterface;

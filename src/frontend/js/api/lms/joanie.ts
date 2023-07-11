import JoanieApi from 'api/joanie';
import { AuthenticationBackend, LMSBackend } from 'types/commonDataProps';
import { APIBackend, APILms } from 'types/api';

import { Maybe, Nullable } from 'types/utils';
import { User } from 'types/User';
import { API, Enrollment } from 'types/Joanie';
import { CourseRun } from 'types';
import { findLmsBackend } from 'api/configuration';

enum JoanieResourceTypes {
  PRODUCTS = 'products',
  COURSE_RUNS = 'course-runs',
}

export const isJoanieProduct = (courseRun: CourseRun) => {
  const handler = findLmsBackend(courseRun.resource_link) as Maybe<LMSBackend>;
  if (handler?.backend !== APIBackend.JOANIE) {
    return false;
  }
  const matches = courseRun.resource_link.match(handler.course_regexp);
  if (!matches) {
    return false;
  }
  const resourceType = matches[1];
  return resourceType === JoanieResourceTypes.PRODUCTS;
};

export const extractResourceId = (courseRun: CourseRun) => {
  const handler = findLmsBackend(courseRun.resource_link) as Maybe<LMSBackend>;
  if (handler?.backend !== APIBackend.JOANIE) {
    return null;
  }
  const matches = courseRun.resource_link.match(handler.course_regexp);
  if (!matches) {
    return null;
  }
  return matches[2];
};

const JoanieEnrollmentApiInterface = (
  APIConf: AuthenticationBackend | LMSBackend,
): APILms['enrollment'] => {
  const joanieAPI: API = JoanieApi();

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

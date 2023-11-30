import { matchPath, PathMatch } from 'react-router-dom';
import JoanieApi from 'api/joanie';
import { LMSBackend } from 'types/commonDataProps';
import { APIBackend, APILms } from 'types/api';

import { Maybe, Nullable } from 'types/utils';
import { User } from 'types/User';
import { API, Enrollment } from 'types/Joanie';
import { CourseRun } from 'types';
import { findLmsBackend } from 'api/configuration';

enum JoanieResourceTypes {
  PRODUCT = 'course-product',
  COURSE_RUN = 'course_run',
}

export const isJoanieResourceLinkProduct = (resource_link: CourseRun['resource_link']) => {
  const resources = extractResourceMetadata(resource_link);
  if (resources === null) return false;

  return Object.keys(resources).join('-') === JoanieResourceTypes.PRODUCT;
};

export const extractResourceMetadata = (resource_link: CourseRun['resource_link']) => {
  const handler = findLmsBackend(resource_link) as Maybe<LMSBackend>;
  if (handler?.backend !== APIBackend.JOANIE) return null;

  const matches: Nullable<RegExpMatchArray> | RegExpMatchArray[] = resource_link.match(
    handler.course_regexp,
  );
  if (!matches) return null;

  const resourceUri = matches[1];
  const existingPathPatterns = ['/course-runs/:course_run', '/courses/:course/products/:product'];
  let match: Nullable<PathMatch<string>>;

  existingPathPatterns.some((pattern) => {
    match = matchPath(
      {
        path: pattern,
        end: true,
      },
      resourceUri,
    );

    return match !== null;
  });

  // @ts-ignore
  if (!match) return null;
  return match.params;
};
export const extractResourceId = (
  resource_link: CourseRun['resource_link'],
  resource_name?: 'product' | 'course' | 'course_run',
) => {
  const resources = extractResourceMetadata(resource_link);

  if (resources === null || (resource_name && !resources.hasOwnProperty(resource_name)))
    return null;

  return resource_name ? resources[resource_name] : Object.values(resources)[0];
};

const JoanieEnrollmentApiInterface = (): APILms['enrollment'] => {
  const joanieAPI: API = JoanieApi();

  return {
    get(url: string) {
      return new Promise((resolve, reject) => {
        const courseRunId = extractResourceId(url, 'course_run');
        joanieAPI.user.enrollments
          .get({ course_run_id: courseRunId as string })
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
      const courseRunId = extractResourceId(url, 'course_run');
      if (!courseRunId) {
        return new Promise((resolve) => resolve(false));
      }

      return new Promise((resolve, reject) => {
        if (!enrollment) {
          joanieAPI.user.enrollments
            .create({
              course_run_id: courseRunId,
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
              course_run_id: courseRunId,
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

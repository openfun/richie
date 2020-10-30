import { AuthenticationBackend, LMSBackend } from 'types/commonDataProps';
import { Nullable, Maybe } from 'utils/types';
import { User } from 'types/User';
import { ApiImplementation } from '.';
import EDX from './edx';

const API = (APIConf: LMSBackend | AuthenticationBackend): ApiImplementation => {
  const extractCourseIdFromUrl = (url: string): Maybe<Nullable<string>> =>
    url.match((APIConf as LMSBackend).course_regexp)?.groups?.course_id;

  return {
    user: EDX(APIConf).user,
    enrollment: {
      get: async (url: string, user: Nullable<User>) =>
        new Promise((resolve) => {
          const courseId = extractCourseIdFromUrl(url);
          const startDateTime = new Date(Date.now() - Math.random() * (200 * 24 * 60 * 60 * 1000)); // 200days < startDate < now
          const endDateTime = new Date(
            startDateTime.getTime() + Math.random() * (90 * 24 * 60 * 60 * 1000),
          ); // starDate < endDate < startDate + 90days
          const enrollmentStartDateTime = new Date(
            startDateTime.getTime() +
              Math.random() * (endDateTime.getTime() - startDateTime.getTime()),
          );
          const enrollmentEndDateTime = new Date(
            enrollmentStartDateTime.getTime() +
              Math.random() * (endDateTime.getTime() - enrollmentStartDateTime.getTime()),
          );

          if (user && sessionStorage.getItem(`${user.username}-${courseId}`)) {
            resolve({
              created: new Date().toISOString(),
              mode: 'audit',
              is_active: true,
              course_details: {
                course_id: courseId,
                course_name: `Course: ${courseId}`,
                enrollment_start: enrollmentStartDateTime.toISOString(),
                enrollment_end: enrollmentEndDateTime.toISOString(),
                course_start: startDateTime.toISOString(),
                course_end: endDateTime.toISOString(),
                invite_only: false,
                course_modes: [
                  {
                    slug: 'audit',
                    name: 'Audit',
                    min_price: 0,
                    suggested_prices: '',
                    currency: 'eur',
                    expiration_datetime: null,
                    description: null,
                    sku: null,
                    bulk_sku: null,
                  },
                ],
              },
              user: user.username,
            });
          }
          resolve(null);
        }),
      isEnrolled: async (url: string, user: Nullable<User>): Promise<boolean> =>
        new Promise((resolve) => {
          const courseId = extractCourseIdFromUrl(url);
          resolve(Boolean(sessionStorage.getItem(`${user?.username}-${courseId}`)));
        }),
      set: (url: string, user: User): Promise<boolean> =>
        new Promise((resolve) => {
          const courseId = extractCourseIdFromUrl(url);
          sessionStorage.setItem(`${user.username}-${courseId}`, 'true');
          resolve(true);
        }),
    },
  };
};

export default API;

import Cookies from 'js-cookie';
import { AuthenticationBackend, LMSBackend } from 'types/commonDataProps';
import { Maybe, Nullable } from 'utils/types';
import { User } from 'types/User';
import { APILms, ApiOptions } from 'types/api';
import { location } from 'utils/indirection/window';
import { handle } from 'utils/errors/handle';
import { EDX_CSRF_TOKEN_COOKIE_NAME } from 'settings';

/**
 *
 * OpenEdX Hawthorn API Implementation
 *
 * This implementation is used for OpenEdX Hawthorn and upper until routes used
 * will not be compatible.
 *
 */

const API = (APIConf: AuthenticationBackend | LMSBackend, options?: ApiOptions): APILms => {
  const extractCourseIdFromUrl = (url: string): Maybe<Nullable<string>> => {
    const matches = url.match((APIConf as LMSBackend).course_regexp);
    return matches && matches[1] ? matches[1] : null;
  };

  const ROUTES = {
    user: {
      me: APIConf.endpoint.concat(options?.routes?.user?.me ?? '/api/user/v1/me'),
      login: APIConf.endpoint.concat(options?.routes?.user?.login ?? `/login`),
      register: APIConf.endpoint.concat(options?.routes?.user?.register ?? `/register`),
      logout: APIConf.endpoint.concat(options?.routes?.user?.logout ?? '/logout'),
    },
    enrollment: {
      get: APIConf.endpoint.concat(
        options?.routes?.enrollment?.get ?? '/api/enrollment/v1/enrollment',
      ),
      isEnrolled: APIConf.endpoint.concat(
        options?.routes?.enrollment?.isEnrolled ?? '/api/enrollment/v1/enrollment',
      ),
      set: APIConf.endpoint.concat('/api/enrollment/v1/enrollment'),
    },
  };

  return {
    user: {
      me: async () => {
        return fetch(ROUTES.user.me, { credentials: 'include' })
          .then((res) => {
            if (res.ok) return res.json();
            if (res.status === 401) return null;
            throw new Error(`[SESSION OpenEdX API] > Cannot retrieve user`);
          })
          .catch((error) => {
            handle(error);
            return null;
          });
      },
      /* 
        / ! \ Prefix next param with richie.
        In this way, OpenEdX Nginx conf knows that we want to go back to richie app after login/redirect
      */
      login: () => location.assign(`${ROUTES.user.login}?next=richie${location.pathname}`),
      register: () => location.assign(`${ROUTES.user.register}?next=richie${location.pathname}`),
      logout: async () => {
        await fetch(ROUTES.user.logout, {
          mode: 'no-cors',
          credentials: 'include',
        });
      },
    },
    enrollment: {
      get: async (url: string, user: Nullable<User>) => {
        const courseId = extractCourseIdFromUrl(url);
        const params = user ? `${user.username},${courseId}` : courseId;

        return fetch(`${ROUTES.enrollment.get}/${params}`, {
          credentials: 'include',
        })
          .then((response) => {
            if (response.ok) {
              return response.headers.get('Content-Type') === 'application/json'
                ? response.json()
                : null;
            }
            if (response.status === 401 || response.status === 403) return null;
            throw new Error(`[GET - Enrollment] > ${response.status} - ${response.statusText}`);
          })
          .catch((error) => {
            handle(error);
            return null;
          });
      },
      isEnrolled: async (url: string, user?: Nullable<User>): Promise<boolean> => {
        const courseId = extractCourseIdFromUrl(url);
        const params = user ? `${user.username},${courseId}` : courseId;

        return fetch(`${ROUTES.enrollment.isEnrolled}/${params}`, {
          credentials: 'include',
        })
          .then((response) => {
            if (response.ok) {
              return response.headers.get('Content-Type') === 'application/json'
                ? response.json()
                : false;
            }
            if (response.status === 401 || response.status === 403) return false;
            throw new Error(`[GET - Enrollment] > ${response.status} - ${response.statusText}`);
          })
          .then((response) => response.is_active || false)
          .catch((error) => {
            handle(error);
            return false;
          });
      },
      set: async (url: string, user: User): Promise<boolean> => {
        try {
          const courseId = extractCourseIdFromUrl(url);
          /*
            edx_csrf_token cookie is set through a SET_COOKIE header send from a previous request
            e.g: To be able to enroll user, you have to get the enrollment before
          */
          const csrfToken = Cookies.get(EDX_CSRF_TOKEN_COOKIE_NAME) || '';

          const isEnrolled = await fetch(ROUTES.enrollment.set, {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
              'X-CSRFTOKEN': csrfToken,
            },
            body: JSON.stringify({
              user: user.username,
              course_details: {
                course_id: courseId,
              },
            }),
          })
            .then((response) => {
              if (response.ok) return response.json();
              throw new Error(`[SET - Enrollment] > ${response.status} - ${response.statusText}`);
            })
            .then(({ is_active }) => is_active);

          return isEnrolled;
        } catch (error) {
          handle(error);
          return false;
        }
      },
    },
  };
};

export default API;

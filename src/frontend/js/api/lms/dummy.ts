import { AuthenticationBackend, LMSBackend } from 'types/commonDataProps';
import { Maybe, Nullable } from 'types/utils';
import { User } from 'types/User';
import { APILms } from 'types/api';
import { UnknownEnrollment, OpenEdXEnrollment } from 'types';
import { location } from 'utils/indirection/window';
import { CURRENT_JOANIE_DEV_DEMO_USER, RICHIE_USER_TOKEN } from 'settings';
import { base64Decode } from 'utils/base64Parser';
import {
  OpenEdxGender,
  OpenEdxLanguageIsoCode,
  OpenEdxLevelOfEducation,
  OpenEdxApiProfile,
} from 'types/openEdx';
import { OpenEdxFullNameFormValues } from 'components/OpenEdxFullNameForm';

type JWTPayload = {
  email: string;
  exp: number;
  full_name: string;
  iat: number;
  jti: string;
  language: string;
  token_type: 'access';
  username: string;
};

/* All JWT tokens will expire the 12 Dec 2024 ! */
const JOANIE_DEV_DEMO_USER_JWT_TOKENS = {
  admin:
    'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzMzOTI4MjE0LCJpYXQiOjE3MDIzNjU1MjMsImp0aSI6IjRhMzQxZWVmMmVhOTRkNGFiMzQ5OThkOWE4ZDM5MTI0IiwiZW1haWwiOiJhZG1pbkBleGFtcGxlLmNvbSIsImxhbmd1YWdlIjoiZW4tdXMiLCJ1c2VybmFtZSI6ImFkbWluIiwiZnVsbF9uYW1lIjoiIn0.rT8nymp8f4T7tIIXO-M5-ahXBwxoDNVqtaZIrb_GHuk',
  user0:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzMzOTI4MjE0LCJpYXQiOjE3MDIzOTIyMTQsImp0aSI6Ijc2ZDNlNmU2NGYwMzQ4NTg5NTNiOWIxNWIwNDhhNjI0IiwiZW1haWwiOiJjc3RlcGhlbnNvbkBleGFtcGxlLm9yZyIsImxhbmd1YWdlIjoiZnItZnIiLCJ1c2VybmFtZSI6InVzZXIwIiwiZnVsbF9uYW1lIjoiT3RoZXIgT3duZXIifQ.JQRHKdr3Utl9rw-BQyvM8zXsY16CSgscEh9NAaP2INc',
  user1:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzMzOTI4MjE0LCJpYXQiOjE3MDIzOTIyMTQsImp0aSI6IjY3NDBmYzFlOTlhNDQwNzBhN2I1NWNkMTE0M2UzNThhIiwiZW1haWwiOiJuYW5jeTgzQGV4YW1wbGUuY29tIiwibGFuZ3VhZ2UiOiJlbi11cyIsInVzZXJuYW1lIjoidXNlcjEiLCJmdWxsX25hbWUiOiJPdGhlciBPd25lciJ9.mWtt4zKA-SiSQG2Pfrauq9ZYzSCq53qPa0jjdGaqFWQ',
  user2:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzMzOTI4MjE0LCJpYXQiOjE3MDIzOTIyMTQsImp0aSI6IjBhNjkwY2QyZjA5ZTRjMWU4MTE4MzhmNGI0YjEzNGMyIiwiZW1haWwiOiJwYXVsYnJhbmRvbkBleGFtcGxlLm9yZyIsImxhbmd1YWdlIjoiZnItZnIiLCJ1c2VybmFtZSI6InVzZXIyIiwiZnVsbF9uYW1lIjoiT3RoZXIgT3duZXIifQ.EXUlkR-0IIj8xRRnlf9TWyVa8Gh_jPE7aNIu18BI83Q',
  user3:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzMzOTI4MjE0LCJpYXQiOjE3MDIzOTIyMTQsImp0aSI6IjQ5N2IyMTEzYjQ4MjQ2YWNhOWUyMWIyMmZmZGJkYWU5IiwiZW1haWwiOiJqZXNzaWNhNDFAZXhhbXBsZS5jb20iLCJsYW5ndWFnZSI6ImVuLXVzIiwidXNlcm5hbWUiOiJ1c2VyMyIsImZ1bGxfbmFtZSI6Ik90aGVyIE93bmVyIn0.MXEFrvlkxPxlCpS172ls4eNvbV6vEDBJK1T3PHS9CoY',
  user4:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzMzOTI4MjE0LCJpYXQiOjE3MDIzOTIyMTQsImp0aSI6ImMyYTBmMGU0NTI5MTRmNWFhZDdiYTE1YWQ3ZTQ5MjgwIiwiZW1haWwiOiJkb25uYTE5QGV4YW1wbGUubmV0IiwibGFuZ3VhZ2UiOiJlbi11cyIsInVzZXJuYW1lIjoidXNlcjQiLCJmdWxsX25hbWUiOiJPdGhlciBPd25lciJ9.sVmYGo2LO8I1Sz2hP8wRk8yd0n1bOcWsyFG0ZXi5SbE',
  organization_owner:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzMzOTI4MjE0LCJpYXQiOjE3MDIzOTIyMTQsImp0aSI6IjYxNTZiYmNmMjZmMzQzYTBiYTgzM2ZmYzU1M2U1NjBlIiwiZW1haWwiOiJqZWFuLWJhcHRpc3RlLnBlbnJhdGgrb3JnYW5pemF0aW9uX293bmVyQGZ1bi1tb29jLmZyIiwibGFuZ3VhZ2UiOiJlbi11cyIsInVzZXJuYW1lIjoib3JnYW5pemF0aW9uX293bmVyIiwiZnVsbF9uYW1lIjoiT3JnYSBPd25lciBPd25lciJ9.wkdYFBasBIk4U-Vr7SdnkfgoqAlhn7rmr0Bqcs777_w',
  student_user:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzMzOTI4MjE0LCJpYXQiOjE3MDIzOTIyMTQsImp0aSI6ImNkZjAyMGM4ODdjOTQxYzU5ZmExN2FkZGExNjNjMDIzIiwiZW1haWwiOiJqZWFuLWJhcHRpc3RlLnBlbnJhdGgrc3R1ZGVudF91c2VyQGZ1bi1tb29jLmZyIiwibGFuZ3VhZ2UiOiJmci1mciIsInVzZXJuYW1lIjoic3R1ZGVudF91c2VyIiwiZnVsbF9uYW1lIjoiXHUwMGM5dHVkaWFudCJ9.JMdnC2VXwq2VbNPrIYxj8PEq0oJJ4LZZT_ywWyE1lBM',
};

export type DevDemoUser = keyof typeof JOANIE_DEV_DEMO_USER_JWT_TOKENS;

export const RICHIE_DUMMY_IS_LOGGED_IN = 'RICHIE_DUMMY_IS_LOGGED_IN';

function getUserInfo(username: DevDemoUser): User {
  const accessToken = JOANIE_DEV_DEMO_USER_JWT_TOKENS[username];
  const JWTPayload: JWTPayload = JSON.parse(base64Decode(accessToken.split('.')[1]));

  return {
    access_token: accessToken,
    username: JWTPayload.username,
    full_name: JWTPayload.full_name,
  };
}

const API = (APIConf: LMSBackend | AuthenticationBackend): APILms => {
  const extractCourseIdFromUrl = (url: string): Maybe<Nullable<string>> => {
    const matches = url.match((APIConf as LMSBackend).course_regexp);
    return matches && matches[1] ? matches[1] : null;
  };

  const dummyOpenEdxApiProfile: OpenEdxApiProfile = {
    username: 'j_do',
    name: 'John Do',
    email: 'j.do@whois.net',
    country: 'fr',
    level_of_education: OpenEdxLevelOfEducation.MASTER_OR_PROFESSIONNAL_DEGREE,
    gender: OpenEdxGender.MALE,
    year_of_birth: '1971',
    'pref-lang': OpenEdxLanguageIsoCode.ENGLISH,
    language_proficiencies: [{ code: OpenEdxLanguageIsoCode.ENGLISH }],
    date_joined: Date.toString(),
  };

  return {
    user: {
      me: async () => {
        /* Simulate user is authenticated with a valid access_token to request Joanie API.
           JWT Token claim looks like:
            {
              "email": "admin@example.com",
              "exp": 10652256808,
              "full_name": "John Doe",
              "iat": 1652256808,
              "jti": "21dc9fb916cc4f65b54798f62fec4554",
              "language": "en"
              "token_type": "access",
              "username": "admin",
            }
        */
        if (!localStorage.getItem(RICHIE_DUMMY_IS_LOGGED_IN)) {
          return null;
        }
        return CURRENT_JOANIE_DEV_DEMO_USER ? getUserInfo(CURRENT_JOANIE_DEV_DEMO_USER) : null;
      },
      login: () => {
        localStorage.setItem(RICHIE_DUMMY_IS_LOGGED_IN, 'true');
        location.reload();
      },
      register: () => location.reload(),
      logout: async () => {
        localStorage.removeItem(RICHIE_DUMMY_IS_LOGGED_IN);
      },
      accessToken: () => sessionStorage.getItem(RICHIE_USER_TOKEN),
      account: {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        get: (username: string): Promise<OpenEdxApiProfile> => {
          return Promise.resolve({
            username: 'j_do',
            name: 'John Do',
            email: 'j.do@whois.net',
            country: 'fr',
            level_of_education: OpenEdxLevelOfEducation.MASTER_OR_PROFESSIONNAL_DEGREE,
            gender: OpenEdxGender.MALE,
            year_of_birth: '1971',
            'pref-lang': OpenEdxLanguageIsoCode.ENGLISH,
            language_proficiencies: [{ code: OpenEdxLanguageIsoCode.ENGLISH }],
          } as OpenEdxApiProfile);
          return Promise.resolve(dummyOpenEdxApiProfile);
        },
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        update: (username: string, data: OpenEdxFullNameFormValues) => {
          return Promise.resolve({ ...dummyOpenEdxApiProfile, ...data });
        },
      },
    },
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
      isEnrolled: async (enrollment: Maybe<Nullable<UnknownEnrollment>>) =>
        new Promise((resolve) => resolve(!!(enrollment as OpenEdXEnrollment)?.is_active)),
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

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

/* All JWT tokens will expire the 02 Feb 2026 ! */
const JOANIE_DEV_DEMO_USER_JWT_TOKENS = {
  user0:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzcwMjIzOTY5LCJpYXQiOjE3Mzg2ODc5NjksImp0aSI6ImQwZmU1Zjg5ZjFhYTQ4YmM5NDhmNWU4ODFkNTNhNTU2IiwiZW1haWwiOiJwc21pdGhAZXhhbXBsZS5vcmciLCJsYW5ndWFnZSI6ImVuLXVzIiwidXNlcm5hbWUiOiJ1c2VyMCIsImZ1bGxfbmFtZSI6Ik90aGVyIE93bmVyIn0.eCawfaCzpO7U7iUPC1TE_XYDiRjq_crI93GqE8Fj8zc',
  user1:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzcwMjIzOTY5LCJpYXQiOjE3Mzg2ODc5NjksImp0aSI6ImIwYjk3YjZkZjFlMzRkMTg4NjFiMGFhMjcxYWI0YWU1IiwiZW1haWwiOiJzYW1wc29uYW5uYUBleGFtcGxlLm9yZyIsImxhbmd1YWdlIjoiZW4tdXMiLCJ1c2VybmFtZSI6InVzZXIxIiwiZnVsbF9uYW1lIjoiT3RoZXIgT3duZXIifQ.yd46_63iuw19zmzH8aVNRAVAvAE4VGH8W8BjmFs6PPU',
  user2:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzcwMjIzOTY5LCJpYXQiOjE3Mzg2ODc5NjksImp0aSI6ImNmYzY2OTNmY2Q5ZTRlZGViM2Y2NzU1MTZhNDIzMTdiIiwiZW1haWwiOiJsb3BlemFtYmVyQGV4YW1wbGUub3JnIiwibGFuZ3VhZ2UiOiJlbi11cyIsInVzZXJuYW1lIjoidXNlcjIiLCJmdWxsX25hbWUiOiJPdGhlciBPd25lciJ9.TlFILOXY-wK29M_BUgDKgjdOovSfEIlw5cNXed6ZV3w',
  user3:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzcwMjIzOTY5LCJpYXQiOjE3Mzg2ODc5NjksImp0aSI6IjA4ZTcxZGJjYWIyMDRjMmZhZjgyMDVjZTRiNTliMjZiIiwiZW1haWwiOiJsb25nZWxpemFiZXRoQGV4YW1wbGUub3JnIiwibGFuZ3VhZ2UiOiJlbi11cyIsInVzZXJuYW1lIjoidXNlcjMiLCJmdWxsX25hbWUiOiJPdGhlciBPd25lciJ9.8NxYyjc567lO2Yc7me-TQr8PNvKqB5VLRzHd1Z4vA4U',
  user4:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzcwMjIzOTY5LCJpYXQiOjE3Mzg2ODc5NjksImp0aSI6ImVmZGRkM2Q0YTdmZDQ4ZmFhYmZkM2Q2OTI4YzMwM2U4IiwiZW1haWwiOiJqb25lc2plbm5pZmVyQGV4YW1wbGUub3JnIiwibGFuZ3VhZ2UiOiJlbi11cyIsInVzZXJuYW1lIjoidXNlcjQiLCJmdWxsX25hbWUiOiJPdGhlciBPd25lciJ9.Wn5CKuNPn0s4B_76Mxd3zTKqdUMaZGV456bhZ-fDe-o',
  organization_owner:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzcwMjIzOTY5LCJpYXQiOjE3Mzg2ODc5NjksImp0aSI6ImRiYmU2ZGExZjhmNDQzNDA4N2U2NzQ0YTIzM2JmNjFiIiwiZW1haWwiOiJkZXZlbG9wZXIrb3JnYW5pemF0aW9uX293bmVyQGV4YW1wbGUuY29tIiwibGFuZ3VhZ2UiOiJlbi11cyIsInVzZXJuYW1lIjoib3JnYW5pemF0aW9uX293bmVyIiwiZnVsbF9uYW1lIjoiT3JnYSBPd25lciJ9.a6QjOAOxCw7ZFKvg8OCcUaW8Xhbmfuqy3cwIqUCPfzE',
  student_user:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzcwMjIzOTY5LCJpYXQiOjE3Mzg2ODc5NjksImp0aSI6IjNhMGExYjM0OWEwNDQxNTg5ODU4NGUwZjMwNTc5M2EwIiwiZW1haWwiOiJkZXZlbG9wZXIrc3R1ZGVudF91c2VyQGV4YW1wbGUuY29tIiwibGFuZ3VhZ2UiOiJmci1mciIsInVzZXJuYW1lIjoic3R1ZGVudF91c2VyIiwiZnVsbF9uYW1lIjoiXHUwMGM5dHVkaWFudCJ9.3VvjPXwtuNA684hSIem3X2uFD-4WH8fipVDXMsi1cAc',
  second_student_user:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzcwMjIzOTY5LCJpYXQiOjE3Mzg2ODc5NjksImp0aSI6Ijg5ZDIyNDJjODRkODRiNThiZWVkYjg1NmU2MGNiM2FiIiwiZW1haWwiOiJkZXZlbG9wZXIrc2Vjb25kX3N0dWRlbnRfdXNlckBleGFtcGxlLmNvbSIsImxhbmd1YWdlIjoiZnItZnIiLCJ1c2VybmFtZSI6InNlY29uZF9zdHVkZW50X3VzZXIiLCJmdWxsX25hbWUiOiJcdTAwYzl0dWRpYW50IDAwMiJ9.p5p4Ku0w8mHortWW9TYHTJgORF9wnfCpq-6pvBRjU0Y',
  admin:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzcwMjIzOTY5LCJpYXQiOjE3Mzg2ODc5NjksImp0aSI6Ijk4M2UzNmI5MTUzODQ2Mjg4ZGMxNWNjOTAwNDgwMDA4IiwiZW1haWwiOiJhZG1pbkBleGFtcGxlLmNvbSIsImxhbmd1YWdlIjoiZW4tdXMiLCJ1c2VybmFtZSI6ImFkbWluIiwiZnVsbF9uYW1lIjoiIn0.VuSqfh4l0vtIDSdkEgCNyciiOhlFlMAsf5u5snm2Avw',
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
    name: 'John Doe',
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

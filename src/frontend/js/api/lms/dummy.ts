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

/* All JWT tokens will expire the 05 Feb 2027 ! */
const JOANIE_DEV_DEMO_USER_JWT_TOKENS = {
  admin:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxODAxODMyNDI4LCJpYXQiOjE3NzAyOTY0MjgsImp0aSI6IjY2NWQ2N2Y3ZTU4MzQyMDc4YTg1MWNjNTFhNGMyMDg5IiwiZW1haWwiOiJhZG1pbkBleGFtcGxlLmNvbSIsImxhbmd1YWdlIjoiZW4tdXMiLCJ1c2VybmFtZSI6ImFkbWluIiwiZnVsbF9uYW1lIjoiIn0.yDC39WViIYl_pnJAjTedpVNBl14lSXZsXbDv-604VOo',
  organization_owner:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxODAxODMyNDI4LCJpYXQiOjE3NzAyOTY0MjgsImp0aSI6IjlmY2EyZTA5MjcxYjRmZDQ5MTAzMGQ5YjJkMzk3MDhhIiwiZW1haWwiOiJkZXZlbG9wZXIrb3JnYW5pemF0aW9uX293bmVyQGV4YW1wbGUuY29tIiwibGFuZ3VhZ2UiOiJmci1mciIsInVzZXJuYW1lIjoib3JnYW5pemF0aW9uX293bmVyIiwiZnVsbF9uYW1lIjoiT3JnYSBPd25lciJ9.lf2ePQ-xZ-uHY6azh32kFIU3JvzKn3YJZZjmkApqBuE',
  student_user:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxODAxODMyNDI4LCJpYXQiOjE3NzAyOTY0MjgsImp0aSI6ImU0M2U3NDg4NDBlYzRkMTI4YTUzMTZmZDY0M2Y1ZWZjIiwiZW1haWwiOiJkZXZlbG9wZXIrc3R1ZGVudF91c2VyQGV4YW1wbGUuY29tIiwibGFuZ3VhZ2UiOiJlbi11cyIsInVzZXJuYW1lIjoic3R1ZGVudF91c2VyIiwiZnVsbF9uYW1lIjoiXHUwMGM5dHVkaWFudCJ9.KViEfiPEv9UGq3nuYxoXBOcJDXxoBfr-sPZEqEJtve4',
  second_student_user:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxODAxODMyNDI4LCJpYXQiOjE3NzAyOTY0MjgsImp0aSI6IjIzZDI1OGI5ZmIxMzQyMWFiNDlmNDk1M2RjMjRkZjM5IiwiZW1haWwiOiJkZXZlbG9wZXIrc2Vjb25kX3N0dWRlbnRfdXNlckBleGFtcGxlLmNvbSIsImxhbmd1YWdlIjoiZnItZnIiLCJ1c2VybmFtZSI6InNlY29uZF9zdHVkZW50X3VzZXIiLCJmdWxsX25hbWUiOiJcdTAwYzl0dWRpYW50IDAwMiJ9.WOSPWNi9XRAap4Cd0Nzwp7A-3M1Rkp4A2k9yFI1sUdQ',
  user4:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxODAxODMyNDI4LCJpYXQiOjE3NzAyOTY0MjgsImp0aSI6ImM0ZThjNDhmYTVhMjQyOTZhMzliMzQzNDI5MTYxYmU2IiwiZW1haWwiOiJkdXN0aW5tYXJ0aW5lekBleGFtcGxlLmNvbSIsImxhbmd1YWdlIjoiZW4tdXMiLCJ1c2VybmFtZSI6InVzZXI0IiwiZnVsbF9uYW1lIjoiSmFyZWQgQmVuc29uIn0.J6q6Vgn-TJBCF1HJk7jf8OWjdI5zBjCHYAdoJeVB_Lk',
  user5:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxODAxODMyNDI4LCJpYXQiOjE3NzAyOTY0MjgsImp0aSI6ImEzMzNhNjZjMTJmODQ5ZDNhY2FmMzFjNDc1NzVmZjFiIiwiZW1haWwiOiJnYWNvc3RhQGV4YW1wbGUub3JnIiwibGFuZ3VhZ2UiOiJlbi11cyIsInVzZXJuYW1lIjoidXNlcjUiLCJmdWxsX25hbWUiOiJKZXJyeSBKYW1lcyJ9.E9Cs8ETQveN7VNq0gq3enIBFWbth3ESZ1JHrIaeQvkY',
  user6:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxODAxODMyNDI4LCJpYXQiOjE3NzAyOTY0MjgsImp0aSI6ImNhZDAzOTFkMTk5NjQwNWQ5YThmZWYzMGQ4YzBiZTNiIiwiZW1haWwiOiJtb3JnYW5kb25uYUBleGFtcGxlLmNvbSIsImxhbmd1YWdlIjoiZnItZnIiLCJ1c2VybmFtZSI6InVzZXI2IiwiZnVsbF9uYW1lIjoiS3Jpc3RpbiBOb2JsZSJ9.FowqEHxSh72wGq52QTm6aG3U1GZfcJBQseiSPm4RXOc',
  user7:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxODAxODMyNDI4LCJpYXQiOjE3NzAyOTY0MjgsImp0aSI6ImJhZjUxYjM4OWNhNzQwYWVhMzk3Y2EwY2QzOGFmYzczIiwiZW1haWwiOiJ0dXJuZXJtYWRpc29uQGV4YW1wbGUubmV0IiwibGFuZ3VhZ2UiOiJmci1mciIsInVzZXJuYW1lIjoidXNlcjciLCJmdWxsX25hbWUiOiJCZWNreSBWYXNxdWV6In0.mtbflgik7w7PEVJ-W6mjL2Wnq-bKrugGlWkkmc_jxxU',
  user8:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxODAxODMyNDI4LCJpYXQiOjE3NzAyOTY0MjgsImp0aSI6IjM4NWNiZDljMTI4MjQxMDk4YjZlOGFmYjI2ZjA1Y2Y0IiwiZW1haWwiOiJyb2JlcnQ3NUBleGFtcGxlLm5ldCIsImxhbmd1YWdlIjoiZW4tdXMiLCJ1c2VybmFtZSI6InVzZXI4IiwiZnVsbF9uYW1lIjoiS2V2aW4gQm9vbmUifQ.c_mwfr72SC49hdNOupjgPlplPXBOrm0Gb5d5KuC6NI4',
  user9:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxODAxODMyNDI4LCJpYXQiOjE3NzAyOTY0MjgsImp0aSI6IjI5MGVlN2UxZDQ5YTRjZTJiOTk1ZGMyOWExN2QyOTZiIiwiZW1haWwiOiJjbGFya2tpbWJlcmx5QGV4YW1wbGUubmV0IiwibGFuZ3VhZ2UiOiJlbi11cyIsInVzZXJuYW1lIjoidXNlcjkiLCJmdWxsX25hbWUiOiJKb2huIE93ZW5zIn0.ke-2g7942a2LgBR2OpMxYg-ozB7269ymWx8nzaJs-kc',
  user10:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxODAxODMyNDI4LCJpYXQiOjE3NzAyOTY0MjgsImp0aSI6ImMxMWJhNDY3YWY0YTRjMWFhZDIwOTZhOGU1MDA3NTJiIiwiZW1haWwiOiJiZW5qYW1pbjU5QGV4YW1wbGUub3JnIiwibGFuZ3VhZ2UiOiJlbi11cyIsInVzZXJuYW1lIjoidXNlcjEwIiwiZnVsbF9uYW1lIjoiUm9uYWxkIEpvaG5zb24ifQ.c_AEOp6jD_K0xsJK4ZvkZcGnKlD3wmm_eJ2UEBGY5v0',
  user11:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxODAxODMyNDI4LCJpYXQiOjE3NzAyOTY0MjgsImp0aSI6Ijc5ZDg3NDkxZDU0NDRmMWVhZDAzYTYyMmQ0NWI0Y2E1IiwiZW1haWwiOiJhbWFuZGExMUBleGFtcGxlLm5ldCIsImxhbmd1YWdlIjoiZW4tdXMiLCJ1c2VybmFtZSI6InVzZXIxMSIsImZ1bGxfbmFtZSI6IkNoZXJ5bCBUYXlsb3IifQ.e6DEq75EHvCgtjf7aLr7Tk1DyZ9-4f-n-W8DXySCZZM',
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

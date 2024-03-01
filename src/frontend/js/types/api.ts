import { Maybe, Nullable } from 'types/utils';
import { User } from 'types/User';
import { UnknownEnrollment } from 'types';

export interface APIListRequestParams {
  [key: string]: Maybe<string | string[]>;
  limit: string;
  offset: string;
  query?: string;
}

export interface APIResponseListMeta {
  count: number;
  offset: number;
  total_count: number;
}
export interface APIAuthentication {
  accessToken?: () => Nullable<string>;
  login: () => void;
  logout: () => Promise<void>;
  me: () => Promise<Nullable<User>>;
  register: () => void;
}

export interface APIEnrollment {
  get(url: string, user: Nullable<User>): Promise<Nullable<UnknownEnrollment>>;
  isEnrolled(enrollment: Maybe<Nullable<UnknownEnrollment>>): Promise<Maybe<boolean>>;
  set(
    url: string,
    user: User,
    enrollment?: Maybe<Nullable<UnknownEnrollment>>,
    isActive?: boolean,
  ): Promise<boolean>;
  meta?: {
    canUnenroll?: boolean;
  };
}

export interface APILms {
  user: APIAuthentication;
  enrollment: APIEnrollment;
}

export interface APIRoute {
  [key: string]: string | APIRoute;
}

export interface APIOptions {
  routes: APIRoute;
}

export enum APIBackend {
  DUMMY = 'dummy',
  FONZIE = 'fonzie',
  JOANIE = 'joanie',
  OPENEDX_DOGWOOD = 'openedx-dogwood',
  OPENEDX_HAWTHORN = 'openedx-hawthorn',
}

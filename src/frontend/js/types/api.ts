import { Course } from 'types/Course';
import { FacetedFilterDefinition } from 'types/filters';
import { Maybe, Nullable } from 'utils/types';
import { User } from 'types/User';
import { Enrollment } from 'types';

export enum RequestStatus {
  FAILURE = 'failure',
  LOADING = 'loading',
  SUCCESS = 'success',
}

export interface APIResponseListMeta {
  count: number;
  offset: number;
  total_count: number;
}

export interface APIResponseListFacets {
  [resourcePropName: string]: {
    [resourcePropValue: string]: number;
  };
}

export interface APIListRequestParams {
  [key: string]: Maybe<string | string[]>;
  limit: string;
  offset: string;
  query?: string;
}

export interface APICourseSearchResponse {
  filters: {
    [filterName: string]: FacetedFilterDefinition;
  };
  meta: APIResponseListMeta;
  objects: Course[];
}

export interface ApiImplementation {
  user: {
    me: () => Promise<Nullable<User>>;
    login: () => void;
    register: () => void;
    logout: () => Promise<void>;
  };
  enrollment: {
    get: (url: string, user: Nullable<User>) => Promise<Nullable<Enrollment>>;
    isEnrolled: (url: string, user: Nullable<User>) => Promise<boolean>;
    set: (url: string, user: User) => Promise<boolean>;
  };
}

export interface ApiOptions {
  routes: {
    [Model: string]: {
      [Method: string]: string;
    };
  };
}

export enum ApiBackend {
  BASE = 'base',
  OPENEDX_DOGWOOD = 'openedx-dogwood',
  OPENEDX_HAWTHORN = 'openedx-hawthorn',
}

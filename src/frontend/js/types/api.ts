import { Maybe } from '../utils/types';
import { Course } from './Course';
import { FilterDefinition } from './filters';

export enum requestStatus {
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
    [filterName: string]: FilterDefinition;
  };
  meta: APIResponseListMeta;
  objects: Course[];
}

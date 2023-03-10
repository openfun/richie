import { Course } from 'types/Course';
import { APIResponseListMeta } from 'types/api';
import { FacetedFilterDefinition } from 'types/filters';

export enum RequestStatus {
  FAILURE = 'failure',
  LOADING = 'loading',
  SUCCESS = 'success',
}

export interface APIResponseListFacets {
  [resourcePropName: string]: {
    [resourcePropValue: string]: number;
  };
}

export interface APICourseSearchResponse {
  filters: {
    [filterName: string]: FacetedFilterDefinition;
  };
  meta: APIResponseListMeta;
  objects: Course[];
}

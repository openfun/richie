import { Resource } from './Resource';

export interface APIResponseListMeta {
  limit: number;
  offset: number;
  total_count: number;
}

export interface APIResponseListFacets {
  [resourcePropName: string]: {
    [resourcePropValue: string]: number;
  };
}

export interface APIListCommonRequestParams {
  limit: number;
  offset: number;
}

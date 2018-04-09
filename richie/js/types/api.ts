export interface APIResponseListMeta {
  limit: number;
  offset: number;
  total_count: number;
}

export interface APIListCommonRequestParams {
  limit?: number;
  offset?: number;
}

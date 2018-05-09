import { stringify } from 'query-string';

import { APIListCommonRequestParams } from '../../../types/api';
import { Maybe, Nullable } from '../../../utils/types';

export interface HistoryPushState {
  state: Nullable<{}>;
  title: string;
  type: 'HISTORY_PUSH_STATE';
  url: string;
}

export function pushQueryStringToHistory(
  queryStringParams: APIListCommonRequestParams & {
    [key: string]: Maybe<string | number | Array<string | number>>;
  },
) {
  return {
    state: null,
    title: '',
    type: 'HISTORY_PUSH_STATE',
    url: `?${stringify(queryStringParams)}`,
  };
}

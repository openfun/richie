import { stringify } from 'query-string';

import { API_LIST_DEFAULT_PARAMS } from 'settings';
import { APICourseSearchResponse, APIListRequestParams, RequestStatus } from 'types/api';

export interface GetListSagaSpecifics {
  endpoint: string;
}

export type FetchListResponse =
  | { status: RequestStatus.SUCCESS; content: APICourseSearchResponse }
  | { status: RequestStatus.FAILURE; error: unknown };

// Wrap fetch to handle params, headers, parsing & sane response handling
export async function fetchList(
  kind: string,
  params: APIListRequestParams = API_LIST_DEFAULT_PARAMS,
): Promise<FetchListResponse> {
  try {
    const response = await fetch(`/api/v1.0/${kind}/?${stringify(params)}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      // Push remote errors to the error channel for consistency
      throw new Error(`Failed to get list from ${kind} search : ${response.status}.`);
    }

    const content = await response.json();

    return { status: RequestStatus.SUCCESS, content };
  } catch (error) {
    return { status: RequestStatus.FAILURE, error };
  }
}

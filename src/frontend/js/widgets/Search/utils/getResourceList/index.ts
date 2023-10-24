import queryString from 'query-string';

import { API_LIST_DEFAULT_PARAMS } from 'settings';
import { APIListRequestParams } from 'types/api';
import { HttpError } from 'utils/errors/HttpError';
import { handle } from 'utils/errors/handle';
import { APICourseSearchResponse, RequestStatus } from '../../types/api';

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
    const response = await fetch(`/api/v1.0/${kind}/?${queryString.stringify(params)}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      // Push remote errors to the error channel for consistency
      throw new HttpError(response.status, `Failed to get list from ${kind} search.`);
    }

    const content = await response.json();

    return { status: RequestStatus.SUCCESS, content };
  } catch (error) {
    if (error instanceof HttpError && error.code >= 500) {
      handle(error);
    }
    return { status: RequestStatus.FAILURE, error };
  }
}

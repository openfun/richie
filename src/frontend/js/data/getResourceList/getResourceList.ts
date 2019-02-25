import { stringify } from 'query-string';

import { API_ENDPOINTS, API_LIST_DEFAULT_PARAMS } from '../../settings';
import {
  APICourseSearchResponse,
  APIListRequestParams,
  requestStatus,
} from '../../types/api';
import { modelName } from '../../types/models';

export interface GetListSagaSpecifics {
  endpoint: string;
}

export type fetchListResponse =
  | { status: requestStatus.SUCCESS; content: APICourseSearchResponse }
  | { status: requestStatus.FAILURE; error: string };

// Wrap fetch to handle params, headers, parsing & sane response handling
export async function fetchList(
  resourceName: modelName,
  params: APIListRequestParams = API_LIST_DEFAULT_PARAMS,
): Promise<fetchListResponse> {
  const endpoint = API_ENDPOINTS.search[resourceName];

  try {
    const response = await fetch(`${endpoint}?${stringify(params)}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      // Push remote errors to the error channel for consistency
      throw new Error(
        `Failed to get list from ${endpoint} : ${response.status}.`,
      );
    }

    const content = await response.json();

    return { status: requestStatus.SUCCESS, content };
  } catch (error) {
    return { status: requestStatus.FAILURE, error };
  }
}

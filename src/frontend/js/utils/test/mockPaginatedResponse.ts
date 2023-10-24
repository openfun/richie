import { PaginatedResponse } from 'types/Joanie';

export const mockPaginatedResponse: <Data>(
  results?: Data[],
  totalCount?: number,
  haveNextPage?: boolean,
) => PaginatedResponse<Data> = (results = [], totalCount = 0, haveNextPage = true) => {
  return {
    count: totalCount,
    next: haveNextPage ? 'next' : null,
    previous: null,
    results,
  };
};

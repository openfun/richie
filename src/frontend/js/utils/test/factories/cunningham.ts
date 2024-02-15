import { usePagination } from '@openfun/cunningham-react';
import { factory } from './factories';

export const PaginationFactory = factory((): ReturnType<typeof usePagination> => {
  return {
    page: 1,
    setPage: jest.fn(),
    onPageChange: jest.fn(),
    pagesCount: 1,
    setPagesCount: jest.fn(),
    pageSize: 50,
  };
});

import queryString from 'query-string';
import { location } from 'utils/indirection/window';

import { CourseSearchParamsAction, useCourseSearchParams } from 'hooks/useCourseSearchParams';
import { Pagination } from 'components/Pagination';

interface PaginateCourseSearchProps {
  courseSearchTotalCount: number;
}

export const PaginateCourseSearch = ({ courseSearchTotalCount }: PaginateCourseSearchProps) => {
  const { courseSearchParams, dispatchCourseSearchParamsUpdate } = useCourseSearchParams();
  // Extract pagination information from params and search results meta
  const limit = Number(courseSearchParams.limit);
  const offset = Number(courseSearchParams.offset);
  const currentPage = offset / limit + 1;
  const maxPage = Math.ceil(courseSearchTotalCount / limit);

  return (
    <Pagination
      currentPage={currentPage}
      maxPage={maxPage}
      updateUrl={false}
      onPageChange={(page) => {
        dispatchCourseSearchParamsUpdate({
          // Pages are 1-indexed, we need to 0-index them to calculate the correct offset
          offset: String((page - 1) * limit),
          type: CourseSearchParamsAction.pageChange,
        });
      }}
      renderPageHref={(page) =>
        `?${queryString.stringify({
          ...queryString.parse(location.search),
          offset: String((page - 1) * limit),
        })}`
      }
    />
  );
};

import React, { useContext, useState } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';

import { CourseSearchParamsContext } from '../../data/useCourseSearchParams/useCourseSearchParams';

const messages = defineMessages({
  currentlyReading: {
    defaultMessage: 'Currently reading',
    description:
      'Accessibility helper in pagination, shown next to the current page number (Currently reading Page N)',
    id: 'components.PaginateCourseSearch.currentlyReading',
  },
  pagination: {
    defaultMessage: 'Pagination',
    description: 'Label for the pagination navigation in course search results',
    id: 'components.PaginateCourseSearch.pagination',
  },
});

interface PaginateCourseSearchProps {
  courseSearchTotalCount: number;
}

export const PaginateCourseSearch = ({
  courseSearchTotalCount,
}: PaginateCourseSearchProps) => {
  // Generate a unique ID per instance to ensure our aria-labelledby do not break if there are two
  // or more instances of <PaginateCourseSearch /> on the page
  const [componentId] = useState(Math.random());
  const [courseSearchParams, dispatchCourseSearchParamsUpdate] = useContext(
    CourseSearchParamsContext,
  );

  // Extract pagination information from params and search results meta
  const limit = Number(courseSearchParams.limit);
  const offset = Number(courseSearchParams.offset);
  const currentPage = offset / limit + 1;
  const maxPage = Math.ceil(courseSearchTotalCount / limit);

  // Do not render anything if all the results fit on the first page with the current limit
  if (maxPage === 1) {
    return null;
  }

  // Create the default list of all the page numbers we intend to show
  const pageList = [
    1,
    currentPage - 2,
    currentPage - 1,
    currentPage,
    currentPage + 1,
    currentPage + 2,
    maxPage,
  ]
    // Filter out page numbers below 1 (when currentPage is 1 or 2)
    .filter(page => page > 0)
    // Filter out page numbers above the max (they do not have anything to display)
    .filter(page => page <= maxPage)
    // Drop duplicates (this is trivial as our pageList is sorted)
    .filter((page, index, list) => page !== list[index - 1]);

  return (
    <div className="paginate-course-search">
      <div id={`pagination-label-${componentId}`} className="offscreen">
        <FormattedMessage {...messages.pagination} />
      </div>
      <ul
        role="navigation"
        aria-labelledby={`pagination-label-${componentId}`}
        className="paginate-course-search__list"
      >
        {pageList.map((page, index) => (
          <React.Fragment key={page}>
            {/* Prepend a cell with "..." when the page number we're rendering does not follow the previous one */}
            {page > (pageList[index - 1] || 0) + 1 && (
              <li className="paginate-course-search__list__item">...</li>
            )}
            <li className="paginate-course-search__list__item">
              {page === currentPage ? (
                /* The current page needs different markup as it does not include a link */
                <span
                  className={`paginate-course-search__list__item__page-number
                              paginate-course-search__list__item__page-number--current`}
                >
                  {/*  Help assistive technology users with some context */}
                  <span className="offscreen">
                    <FormattedMessage {...messages.currentlyReading} />{' '}
                  </span>
                  {page === maxPage && <span className="offscreen">Last </span>}
                  {/* Show context "Page 1" on the first item to make it obvious this is pagination */}
                  <span className={page !== 1 ? 'offscreen' : ''}>Page </span>
                  {page}
                </span>
              ) : (
                <a
                  className="paginate-course-search__list__item__page-number"
                  onClick={() =>
                    dispatchCourseSearchParamsUpdate({
                      // Pages are 1-indexed, we need to 0-index them to calculate the correct offset
                      offset: String((page - 1) * limit),
                      type: 'PAGE_CHANGE',
                    })
                  }
                >
                  {/*  Help assistive technology users with some context */}
                  {page === currentPage - 1 && (
                    <span className="offscreen">Previous </span>
                  )}
                  {page === currentPage + 1 && (
                    <span className="offscreen">Next </span>
                  )}
                  {page === maxPage && <span className="offscreen">Last </span>}
                  {/* Show context "Page 1" on the first item to make it obvious this is pagination */}
                  <span className={page !== 1 ? 'offscreen' : ''}>Page </span>
                  {page}
                </a>
              )}
            </li>
          </React.Fragment>
        ))}
      </ul>
    </div>
  );
};

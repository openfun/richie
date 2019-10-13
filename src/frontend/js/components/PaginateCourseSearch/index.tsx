import React, { useContext, useState } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';

import { CourseSearchParamsContext } from '../../data/useCourseSearchParams/useCourseSearchParams';

const messages = defineMessages({
  currentlyReadingLastPageN: {
    defaultMessage: 'Currently reading last page {page}',
    description:
      'Accessibility helper in pagination, shown next to the current page number when it is the last page.',
    id: 'components.PaginateCourseSearch.currentlyReadingLastPageN',
  },
  currentlyReadingPageN: {
    defaultMessage: 'Currently reading page {page}',
    description:
      'Accessibility helper in pagination, shown next to the current page number when it is not the last page.',
    id: 'components.PaginateCourseSearch.currentlyReadingPageN',
  },
  lastPageN: {
    defaultMessage: 'Last page {page}',
    description:
      'Accessibility helper for pagination, added on the last page link.',
    id: 'components.PaginateCourseSearch.lastPageN',
  },
  nextPageN: {
    defaultMessage: 'Next page {page}',
    description:
      'Accessibility helper for pagination, added on the next page link.',
    id: 'components.PaginateCourseSearch.nextPageN',
  },
  pageN: {
    defaultMessage: 'Page {page}',
    description: `Accessibility helper for pagination, added on all page links for screen readers,
      only shown next to "page 1" visually.`,
    id: 'components.PaginateCourseSearch.pageN',
  },
  pagination: {
    defaultMessage: 'Pagination',
    description:
      'Label for the pagination navigation in course search results.',
    id: 'components.PaginateCourseSearch.pagination',
  },
  previousPageN: {
    defaultMessage: 'Previous page {page}',
    description:
      'Accessibility helper for pagination, added on the previous page link.',
    id: 'components.PaginateCourseSearch.previousPageN',
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
    <div className="pagination">
      <div id={`pagination-label-${componentId}`} className="offscreen">
        <FormattedMessage {...messages.pagination} />
      </div>
      <nav aria-labelledby={`pagination-label-${componentId}`}>
        <ul className="pagination__list">
          {pageList.map((page, index) => (
            <React.Fragment key={page}>
              {/* Prepend a cell with "..." when the page number we're rendering does not follow the previous one */}
              {page > (pageList[index - 1] || 0) + 1 && (
                <li className="pagination__list__item pagination__list__item--placeholder">
                  ...
                </li>
              )}

              {page === currentPage ? (
                /* The current page needs different markup as it does not include a link */
                <li className="pagination__list__item pagination__list__item--current">
                  <span className="pagination__list__item__page-number">
                    {/*  Help assistive technology users with some context */}
                    <span className="offscreen">
                      {page === maxPage ? (
                        <FormattedMessage
                          {...messages.currentlyReadingLastPageN}
                          values={{ page }}
                        />
                      ) : (
                        <FormattedMessage
                          {...messages.currentlyReadingPageN}
                          values={{ page }}
                        />
                      )}
                    </span>
                    <span aria-hidden={true}>
                      {/* Show context "Page 1" on the first item to make it obvious this is pagination */}
                      {page === 1 ? (
                        <FormattedMessage
                          {...messages.pageN}
                          values={{ page }}
                        />
                      ) : (
                        page
                      )}
                    </span>
                  </span>
                </li>
              ) : (
                <li className="pagination__list__item">
                  <a
                    className="pagination__list__item__page-number"
                    onClick={() =>
                      dispatchCourseSearchParamsUpdate({
                        // Pages are 1-indexed, we need to 0-index them to calculate the correct offset
                        offset: String((page - 1) * limit),
                        type: 'PAGE_CHANGE',
                      })
                    }
                  >
                    {/*  Help assistive technology users with some context */}
                    <span className="offscreen">
                      {page === maxPage ? (
                        <FormattedMessage
                          {...messages.lastPageN}
                          values={{ page }}
                        />
                      ) : page === currentPage - 1 ? (
                        <FormattedMessage
                          {...messages.previousPageN}
                          values={{ page }}
                        />
                      ) : page === currentPage + 1 ? (
                        <FormattedMessage
                          {...messages.nextPageN}
                          values={{ page }}
                        />
                      ) : (
                        <FormattedMessage
                          {...messages.pageN}
                          values={{ page }}
                        />
                      )}
                    </span>
                    <span aria-hidden={true}>
                      {/* Show context "Page 1" on the first item to make it obvious this is pagination */}
                      {page === 1 ? (
                        <FormattedMessage
                          {...messages.pageN}
                          values={{ page }}
                        />
                      ) : (
                        page
                      )}
                    </span>
                  </a>
                </li>
              )}
            </React.Fragment>
          ))}
        </ul>
      </nav>
    </div>
  );
};

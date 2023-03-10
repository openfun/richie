import { Fragment, useMemo, useState } from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { useHistory } from 'hooks/useHistory';
import { location, scroll } from 'utils/indirection/window';

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
    description: 'Accessibility helper for pagination, added on the last page link.',
    id: 'components.PaginateCourseSearch.lastPageN',
  },
  nextPageN: {
    defaultMessage: 'Next page {page}',
    description: 'Accessibility helper for pagination, added on the next page link.',
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
    description: 'Label for the pagination navigation in course search results.',
    id: 'components.PaginateCourseSearch.pagination',
  },
  previousPageN: {
    defaultMessage: 'Previous page {page}',
    description: 'Accessibility helper for pagination, added on the previous page link.',
    id: 'components.PaginateCourseSearch.previousPageN',
  },
});

export const usePagination = ({ itemsPerPage = 10 }: { itemsPerPage?: number }) => {
  const defaultPage = useMemo(() => {
    // eslint-disable-next-line compat/compat
    const url = new URL(window.location.href);
    if (url.searchParams.has('page')) {
      return Number(url.searchParams.get('page'));
    }
    return 1;
  }, []);
  const [maxPage, setMaxPage] = useState<number>();
  const [currentPage, setCurrentPage] = useState(defaultPage);
  return {
    maxPage,
    setMaxPage,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    onPageChange: (newPage: number) => {
      scroll({
        behavior: 'smooth',
        top: 0,
      });
      setCurrentPage(newPage);
    },
    setItemsCount: (count: number) => {
      setMaxPage(Math.ceil(count / itemsPerPage));
    },
  };
};

export const Pagination = ({
  onPageChange,
  maxPage = 0,
  currentPage,
  renderPageHref,
  updateUrl = true,
}: {
  currentPage: number;
  maxPage?: number;
  onPageChange: (page: number) => void;
  renderPageHref?: (page: number) => string;
  updateUrl?: boolean;
}) => {
  const intl = useIntl();
  const [, pushState] = useHistory();
  // Do not render anything if all the results fit on the first page with the current limit
  if (maxPage <= 1) {
    return null;
  }

  // Create the default list of all the page numbers we intend to show
  const pageList = [
    1,
    // If there is just one page between first page and currentPage - 2,
    // we can display this page number instead of "..."
    currentPage - 2 === 3 ? currentPage - 3 : -1,
    currentPage - 2,
    currentPage - 1,
    currentPage,
    currentPage + 1,
    currentPage + 2,
    // If there is just one page between maxPage and currentPage + 2,
    // we can display this page number instead of "..."
    currentPage + 3 === maxPage - 1 ? currentPage + 3 : -1,
    maxPage,
  ]
    // Filter out page numbers below 1 (when currentPage is 1 or 2)
    .filter((page) => page > 0)
    // Filter out page numbers above the max (they do not have anything to display)
    .filter((page) => page <= maxPage)
    // Drop duplicates (this is trivial as our pageList is sorted)
    .filter((page, index, list) => page !== list[index - 1]);

  return (
    <div className="pagination" data-testid="pagination">
      <nav aria-label={intl.formatMessage(messages.pagination)}>
        <ul className="pagination__list">
          {pageList.map((page, index) => (
            <Fragment key={page}>
              {/* Prepend a cell with "..." when the page number we're rendering does not follow the previous one */}
              {page > (pageList[index - 1] || 0) + 1 && (
                <li className="pagination__item pagination__item--placeholder">...</li>
              )}

              {page === currentPage ? (
                /* The current page needs different markup as it does not include a link */
                <li className="pagination__item pagination__item--current">
                  <span className="pagination__page-number">
                    {/*  Help assistive technology users with some context */}
                    <span className="offscreen">
                      {page === maxPage ? (
                        <FormattedMessage
                          {...messages.currentlyReadingLastPageN}
                          values={{ page }}
                        />
                      ) : (
                        <FormattedMessage {...messages.currentlyReadingPageN} values={{ page }} />
                      )}
                    </span>
                    <span aria-hidden={true}>
                      {/* Show context "Page 1" on the first item to make it obvious this is pagination */}
                      {page === 1 ? (
                        <FormattedMessage {...messages.pageN} values={{ page }} />
                      ) : (
                        page
                      )}
                    </span>
                  </span>
                </li>
              ) : (
                <li className="pagination__item">
                  <a
                    href={renderPageHref ? renderPageHref(page) : `?page=${page}`}
                    className="pagination__page-number"
                    onClick={(event) => {
                      if (!event.metaKey && !event.ctrlKey && !event.shiftKey) {
                        event.preventDefault();
                        onPageChange(page);
                        if (updateUrl) {
                          const url = new URL(window.location.href);
                          url.searchParams.set('page', String(page));
                          pushState({}, '', location.pathname + '?' + url.searchParams.toString());
                        }
                      }
                    }}
                  >
                    {/*  Help assistive technology users with some context */}
                    <span className="offscreen">
                      {page === maxPage ? (
                        <FormattedMessage {...messages.lastPageN} values={{ page }} />
                      ) : page === currentPage - 1 ? (
                        <FormattedMessage {...messages.previousPageN} values={{ page }} />
                      ) : page === currentPage + 1 ? (
                        <FormattedMessage {...messages.nextPageN} values={{ page }} />
                      ) : (
                        <FormattedMessage {...messages.pageN} values={{ page }} />
                      )}
                    </span>
                    <span aria-hidden={true}>
                      {/* Show context "Page 1" on the first item to make it obvious this is pagination */}
                      {page === 1 ? (
                        <FormattedMessage {...messages.pageN} values={{ page }} />
                      ) : (
                        page
                      )}
                    </span>
                  </a>
                </li>
              )}
            </Fragment>
          ))}
        </ul>
      </nav>
    </div>
  );
};

import { fireEvent, screen } from '@testing-library/react';
import queryString from 'query-string';
import { IntlProvider } from 'react-intl';

import { History, HistoryContext } from 'hooks/useHistory';
import { render } from 'utils/test/render';
import { PaginateCourseSearch } from '.';

describe('<PaginateCourseSearch />', () => {
  const historyPushState = jest.fn();
  const historyReplaceState = jest.fn();
  const makeHistoryOf: (params: any) => History = (params) => [
    {
      state: { name: 'courseSearch', data: { params } },
      title: '',
      url: `/search?${queryString.stringify(params)}`,
    },
    historyPushState,
    historyReplaceState,
  ];

  it('shows a pagination for course search (when on page 1)', () => {
    render(
      <IntlProvider locale="en">
        <HistoryContext.Provider value={makeHistoryOf({ limit: '20', offset: '0' })}>
          <PaginateCourseSearch courseSearchTotalCount={200} />
        </HistoryContext.Provider>
      </IntlProvider>,
      { wrapper: null },
    );

    screen.getByRole('navigation', { name: 'Pagination' });
    // Accessibility helpers
    screen.getByText('Currently reading page 1');
    screen.getByText('Next page 2');
    screen.getByText('Page 3');
    screen.getByText('Last page 10');
    // Visual pagination
    screen.getByText('Page 1');
    screen.getByText('3');
    screen.getByText('2');
    screen.getByText('10');
  });

  it('shows a pagination for course search (when on the last page)', () => {
    render(
      <IntlProvider locale="en">
        <HistoryContext.Provider value={makeHistoryOf({ limit: '20', offset: '200' })}>
          <PaginateCourseSearch courseSearchTotalCount={211} />
        </HistoryContext.Provider>
      </IntlProvider>,
      { wrapper: null },
    );

    screen.getByRole('navigation', { name: 'Pagination' });
    // Common text for the first page
    screen.getAllByText('Page 1');
    // Accessibility helpers
    screen.getByText('Page 9');
    screen.getByText('Previous page 10');
    screen.getByText('Currently reading last page 11');
    // Visual pagination
    screen.getByText('9');
    screen.getByText('10');
    screen.getByText('11');
  });

  it('uses anchors to allow opening pagination links in a new tab', () => {
    render(
      <IntlProvider locale="en">
        <HistoryContext.Provider value={makeHistoryOf({ limit: '20', offset: '0' })}>
          <PaginateCourseSearch courseSearchTotalCount={40} />
        </HistoryContext.Provider>
      </IntlProvider>,
      { wrapper: null },
    );
    expect(screen.queryByRole('button')).toBeNull();
    const nextPageAnchor = screen.getByRole('link');
    expect(nextPageAnchor).toHaveAttribute('href', '?offset=20');
  });

  it('shows a pagination for course search (when on an arbitrary page)', () => {
    render(
      <IntlProvider locale="en">
        <HistoryContext.Provider value={makeHistoryOf({ limit: '10', offset: '110' })}>
          <PaginateCourseSearch courseSearchTotalCount={345} />
        </HistoryContext.Provider>
      </IntlProvider>,
      { wrapper: null },
    );

    screen.getByRole('navigation', { name: 'Pagination' });
    // Common text for the first page
    screen.getAllByText('Page 1');
    screen.getAllByText('...');
    // Accessibility helpers
    screen.getByText('Page 10');
    screen.getByText('Previous page 11');
    screen.getByText('Currently reading page 12');
    screen.getByText('Next page 13');
    screen.getByText('Page 14');
    screen.getByText('Last page 35');
    // Visual pagination
    screen.getByText('10');
    screen.getByText('11');
    screen.getByText('12');
    screen.getByText('13');
    screen.getByText('14');
    screen.getByText('35');
  });

  it('does not truncate pagination number with ... if all page numbers follow each other.', () => {
    render(
      <IntlProvider locale="en">
        <HistoryContext.Provider value={makeHistoryOf({ limit: '21', offset: '0' })}>
          <PaginateCourseSearch courseSearchTotalCount={101} />
        </HistoryContext.Provider>
      </IntlProvider>,
      { wrapper: null },
    );

    screen.getByRole('navigation', { name: 'Pagination' });
    // Accessibility helpers
    screen.getByText('Currently reading page 1');
    screen.getByText('Next page 2');
    screen.getByText('Page 3');
    screen.getByText('Last page 5');

    // Visual pagination
    screen.getAllByText('Page 1');
    screen.getByText('2');
    screen.getByText('3');
    screen.getByText('4');
    screen.getByText('5');

    // Any truncation label is displayed
    const truncationLabel = screen.queryAllByText('...');
    expect(truncationLabel).toHaveLength(0);
  });

  it('does not render itself when there is only one page', () => {
    render(
      <IntlProvider locale="en">
        <HistoryContext.Provider value={makeHistoryOf({ limit: '20', offset: '0' })}>
          <PaginateCourseSearch courseSearchTotalCount={14} />
        </HistoryContext.Provider>
      </IntlProvider>,
      { wrapper: null },
    );

    expect(screen.queryByRole('pagination', { name: 'Pagination' })).toEqual(null);
  });

  it('updates the course search params when the user clicks on a page', () => {
    render(
      <IntlProvider locale="en">
        <HistoryContext.Provider value={makeHistoryOf({ limit: '20', offset: '0' })}>
          <PaginateCourseSearch courseSearchTotalCount={200} />
        </HistoryContext.Provider>
      </IntlProvider>,
      { wrapper: null },
    );

    screen.getByRole('navigation', { name: 'Pagination' });
    const page2 = screen.getByText('Next page 2');

    // Change pages when the user clicks on another page
    fireEvent.click(page2);
    expect(historyPushState).toHaveBeenCalledWith(
      {
        name: 'courseSearch',
        data: {
          lastDispatchActions: expect.any(Array),
          params: {
            limit: '20',
            offset: '20',
          },
        },
      },
      '',
      '/?limit=20&offset=20',
    );
  });

  it('does not update the course search params when the user clicks on the current page', () => {
    render(
      <IntlProvider locale="en">
        <HistoryContext.Provider value={makeHistoryOf({ limit: '20', offset: '0' })}>
          <PaginateCourseSearch courseSearchTotalCount={200} />
        </HistoryContext.Provider>
      </IntlProvider>,
      { wrapper: null },
    );

    screen.getByRole('navigation', { name: 'Pagination' });
    const currentPage1 = screen.getByText('Currently reading page 1');

    // Don't do anything when the user clicks on the page they're currently on
    historyPushState.mockReset();
    fireEvent.click(currentPage1);
    expect(historyPushState).not.toHaveBeenCalled();
  });
});

import 'testSetup';

import { fireEvent, render } from '@testing-library/react';
import React from 'react';
import { IntlProvider } from 'react-intl';

import { CourseSearchParamsContext } from 'data/useCourseSearchParams';
import { PaginateCourseSearch } from '.';

describe('<PaginateCourseSearch />', () => {
  beforeEach(jest.resetAllMocks);

  const dispatchCourseSearchParamsUpdate = jest.fn();

  it('shows a pagination for course search (when on page 1)', () => {
    const { getByText } = render(
      <IntlProvider locale="en">
        <CourseSearchParamsContext.Provider
          value={[
            { limit: '20', offset: '0' },
            dispatchCourseSearchParamsUpdate,
          ]}
        >
          <PaginateCourseSearch courseSearchTotalCount={200} />
        </CourseSearchParamsContext.Provider>
      </IntlProvider>,
    );

    getByText('Pagination');
    // Accessibility helpers
    getByText('Currently reading page 1');
    getByText('Next page 2');
    getByText('Page 3');
    getByText('Last page 10');
    // Visual pagination
    getByText('Page 1');
    getByText('3');
    getByText('2');
    getByText('10');
  });

  it('shows a pagination for course search (when on the last page)', () => {
    const { getAllByText, getByText } = render(
      <IntlProvider locale="en">
        <CourseSearchParamsContext.Provider
          value={[
            { limit: '20', offset: '200' },
            dispatchCourseSearchParamsUpdate,
          ]}
        >
          <PaginateCourseSearch courseSearchTotalCount={211} />
        </CourseSearchParamsContext.Provider>
      </IntlProvider>,
    );

    getByText('Pagination');
    // Common text for the first page
    getAllByText('Page 1');
    // Accessibility helpers
    getByText('Page 9');
    getByText('Previous page 10');
    getByText('Currently reading last page 11');
    // Visual pagination
    getByText('9');
    getByText('10');
    getByText('11');
  });

  it('shows a pagination for course search (when on an arbitrary page)', () => {
    const { getAllByText, getByText } = render(
      <IntlProvider locale="en">
        <CourseSearchParamsContext.Provider
          value={[
            { limit: '10', offset: '110' },
            dispatchCourseSearchParamsUpdate,
          ]}
        >
          <PaginateCourseSearch courseSearchTotalCount={345} />
        </CourseSearchParamsContext.Provider>
      </IntlProvider>,
    );

    getByText('Pagination');
    // Common text for the first page
    getAllByText('Page 1');
    // Accessibility helpers
    getByText('Page 10');
    getByText('Previous page 11');
    getByText('Currently reading page 12');
    getByText('Next page 13');
    getByText('Page 14');
    getByText('Last page 35');
    // Visual pagination
    getByText('10');
    getByText('11');
    getByText('12');
    getByText('13');
    getByText('14');
    getByText('35');
  });

  it('does not render itself when there is only one page', () => {
    const { queryByText } = render(
      <IntlProvider locale="en">
        <CourseSearchParamsContext.Provider
          value={[
            { limit: '20', offset: '0' },
            dispatchCourseSearchParamsUpdate,
          ]}
        >
          <PaginateCourseSearch courseSearchTotalCount={14} />
        </CourseSearchParamsContext.Provider>
      </IntlProvider>,
    );

    expect(queryByText('Pagination')).toEqual(null);
  });

  it('updates the course search params when the user clicks on a page', () => {
    const { getByText } = render(
      <IntlProvider locale="en">
        <CourseSearchParamsContext.Provider
          value={[
            { limit: '20', offset: '0' },
            dispatchCourseSearchParamsUpdate,
          ]}
        >
          <PaginateCourseSearch courseSearchTotalCount={200} />
        </CourseSearchParamsContext.Provider>
      </IntlProvider>,
    );

    getByText('Pagination');
    const page2 = getByText('Next page 2');

    // Change pages when the user clicks on another page
    fireEvent.click(page2);
    expect(dispatchCourseSearchParamsUpdate).toHaveBeenCalledWith({
      offset: '20',
      type: 'PAGE_CHANGE',
    });
  });

  it('does not update the course search params when the user clicks on the current page', () => {
    const { getByText } = render(
      <IntlProvider locale="en">
        <CourseSearchParamsContext.Provider
          value={[
            { limit: '20', offset: '0' },
            dispatchCourseSearchParamsUpdate,
          ]}
        >
          <PaginateCourseSearch courseSearchTotalCount={200} />
        </CourseSearchParamsContext.Provider>
      </IntlProvider>,
    );

    getByText('Pagination');
    const currentPage1 = getByText('Currently reading page 1');

    // Don't do anything when the user clicks on the page they're currently on
    dispatchCourseSearchParamsUpdate.mockReset();
    fireEvent.click(currentPage1);
    expect(dispatchCourseSearchParamsUpdate).not.toHaveBeenCalled();
  });
});

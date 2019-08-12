import '../../testSetup';

import { cleanup, fireEvent, render } from '@testing-library/react';
import React from 'react';
import { IntlProvider } from 'react-intl';

import { PaginateCourseSearch } from '.';
import { CourseSearchParamsContext } from '../../data/useCourseSearchParams/useCourseSearchParams';

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
    getByText(
      (content, element) =>
        content.endsWith('1') &&
        element.textContent === 'Currently reading Page 1',
    );
    getByText(
      (content, element) =>
        content.endsWith('2') && element.textContent === 'Next Page 2',
    );
    getByText(
      (content, element) =>
        content.endsWith('3') && element.textContent === 'Page 3',
    );
    getByText(
      (content, element) =>
        content.endsWith('10') && element.textContent === 'Last Page 10',
    );
  });

  it('shows a pagination for course search (when on the last page)', () => {
    const { getByText } = render(
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
    getByText(
      (content, element) =>
        content.endsWith('1') && element.textContent === 'Page 1',
    );
    getByText(
      (content, element) =>
        content.endsWith('9') && element.textContent === 'Page 9',
    );
    getByText(
      (content, element) =>
        content.endsWith('10') && element.textContent === 'Previous Page 10',
    );
    getByText(
      (content, element) =>
        content.endsWith('11') &&
        element.textContent === 'Currently reading Last Page 11',
    );
  });

  it('shows a pagination for course search (when on an arbitrary page)', () => {
    const { getByText } = render(
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
    getByText(
      (content, element) =>
        content.endsWith('1') && element.textContent === 'Page 1',
    );
    getByText(
      (content, element) =>
        content.endsWith('10') && element.textContent === 'Page 10',
    );
    getByText(
      (content, element) =>
        content.endsWith('11') && element.textContent === 'Previous Page 11',
    );
    getByText(
      (content, element) =>
        content.endsWith('12') &&
        element.textContent === 'Currently reading Page 12',
    );
    getByText(
      (content, element) =>
        content.endsWith('13') && element.textContent === 'Next Page 13',
    );
    getByText(
      (content, element) =>
        content.endsWith('14') && element.textContent === 'Page 14',
    );
    getByText(
      (content, element) =>
        content.endsWith('35') && element.textContent === 'Last Page 35',
    );
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
    const page2 = getByText(
      (content, element) =>
        content.endsWith('2') && element.textContent === 'Next Page 2',
    );

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
    const currentPage1 = getByText(
      (content, element) =>
        content.endsWith('1') &&
        element.textContent === 'Currently reading Page 1',
    );

    // Don't do anything when the user clicks on the page they're currently on
    dispatchCourseSearchParamsUpdate.mockReset();
    fireEvent.click(currentPage1);
    expect(dispatchCourseSearchParamsUpdate).not.toHaveBeenCalled();
  });
});

import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';

import { ContextFactory } from 'utils/test/factories';
import { CommonDataProps } from 'types/commonDataProps';
import { Course } from 'types/Course';
import { CourseGlimpseList } from '.';

describe('components/CourseGlimpseList', () => {
  const contextProps: CommonDataProps['context'] = ContextFactory().generate();

  it('renders a list of Courses into a list of CourseGlimpses', () => {
    const courses = [
      {
        id: '44',
        state: { datetime: '2019-03-14T10:35:47.823Z', text: '' },
        title: 'Course 44',
      },
      {
        id: '45',
        state: { datetime: '2019-03-14T10:35:47.823Z', text: '' },
        title: 'Course 45',
      },
    ] as Course[];
    const { container } = render(
      <IntlProvider locale="en">
        <CourseGlimpseList
          context={contextProps}
          courses={courses}
          meta={{ count: 20, offset: 0, total_count: 45 }}
        />
      </IntlProvider>,
    );

    expect(
      screen.getAllByText('Showing 1 to 20 of 45 courses matching your search').length,
    ).toEqual(1);
    // Both courses' titles are shown
    screen.getByText('Course 44');
    screen.getByText('Course 45');

    // a (shorter) message warns screen reader users about new results
    screen.getByText('45 courses matching your search');
    const srOnlyCount = screen.queryByTestId('course-glimpse-sr-count');
    expect(srOnlyCount).toHaveAttribute('aria-live', 'polite');
    expect(srOnlyCount).toHaveAttribute('aria-atomic', 'true');
    // the message shown in the UI
    expect(container.querySelector('.course-glimpse-list__count')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
  });
});

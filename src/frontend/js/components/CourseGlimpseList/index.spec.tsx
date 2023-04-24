import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';

import { RichieContextFactory } from 'utils/test/factories/richie';
import { CommonDataProps } from 'types/commonDataProps';
import { CourseGlimpseCourse } from 'components/CourseGlimpse';
import { Priority } from 'types';
import { CourseGlimpseList } from '.';

describe('widgets/Search/components/CourseGlimpseList', () => {
  const contextProps: CommonDataProps['context'] = RichieContextFactory().one();

  it('renders a list of Courses into a list of CourseGlimpses', () => {
    const courses = [
      {
        id: '44',
        code: 'AAA',
        organization: {
          title: "Awesome univ'",
        },
        state: {
          datetime: '2019-03-14T10:35:47.823Z',
          text: 'archived',
          call_to_action: null,
          priority: Priority.ARCHIVED_CLOSED,
        },
        title: 'Course 44',
      },
      {
        id: '45',
        code: 'BBB',
        organization: {
          title: "Bad univ'",
        },
        state: {
          datetime: '2019-03-14T10:35:47.823Z',
          text: 'archived',
          call_to_action: null,
          priority: Priority.ARCHIVED_CLOSED,
        },
        title: 'Course 45',
      },
    ] as CourseGlimpseCourse[];
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

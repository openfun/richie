import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';

import { RichieContextFactory, CourseLightFactory } from 'utils/test/factories/richie';
import { CommonDataProps } from 'types/commonDataProps';
import { CourseStateTextEnum, Priority } from 'types';
import { CourseGlimpseList, getCourseGlimpseListProps } from '.';

describe('widgets/Search/components/CourseGlimpseList', () => {
  const contextProps: CommonDataProps['context'] = RichieContextFactory().one();

  it('renders a list of Courses into a list of CourseGlimpses', () => {
    const courses = [
      CourseLightFactory({
        id: '44',
        code: 'AAA',
        organizations: ["Awesome univ'"],
        state: {
          datetime: '2019-03-14T10:35:47.823Z',
          text: CourseStateTextEnum.ARCHIVED,
          call_to_action: null,
          priority: Priority.ARCHIVED_CLOSED,
        },
        title: 'Course 44',
      }).one(),
      CourseLightFactory({
        id: '45',
        code: 'BBB',
        organizations: ["Bad univ'"],
        state: {
          datetime: '2019-03-14T10:35:47.823Z',
          text: CourseStateTextEnum.ARCHIVED,
          call_to_action: null,
          priority: Priority.ARCHIVED_CLOSED,
        },
        title: 'Course 45',
      }).one(),
    ];
    const { container } = render(
      <IntlProvider locale="en">
        <CourseGlimpseList
          context={contextProps}
          courses={getCourseGlimpseListProps(courses)}
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
    expect(container.querySelector('.list__count-description')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
  });
});

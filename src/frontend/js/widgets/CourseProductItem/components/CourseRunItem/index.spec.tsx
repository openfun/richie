import faker from 'faker';
import { screen, getByText, render } from '@testing-library/react';
import { OrderFactory } from 'utils/test/factories/joanie';
import type { CourseRun, Order } from 'types/Joanie';
import { OrderState } from 'types/Joanie';
import CourseRunItem from '.';

jest.mock('../CourseProductCourseRuns', () => ({
  CourseRunList: ({ courseRuns }: { courseRuns: CourseRun[] }) => (
    <div data-testid={`CourseRunList-${courseRuns.map(({ id }) => id).join('-')}`} />
  ),
}));

describe('CourseRunItem', () => {
  it('does not allow user which purchase the product to enroll to course if order state is not validated', async () => {
    const order: Order = OrderFactory.afterGenerate((o: Order) => ({
      ...o,
      state: faker.helpers.randomize([OrderState.CANCELED, OrderState.PENDING]),
    })).generate();
    const targetCourse = order.target_courses[0];

    render(<CourseRunItem targetCourse={targetCourse} order={order} />);

    // - It should render CourseRunList component
    const $item = screen.getByTestId(`course-item-${targetCourse.code}`);
    // the course title shouldn't be a heading to prevent misdirection for screen reader users,
    // but we want to it to visually look like a h5
    const $courseTitle = getByText($item, targetCourse.title);
    expect($courseTitle.tagName).toBe('STRONG');
    expect($courseTitle.classList.contains('h5')).toBe(true);
    screen.getByTestId(`CourseRunList-${targetCourse.course_runs.map(({ id }) => id).join('-')}`);

    // - Does not Render <SaleTunnel />
    expect(screen.queryByTestId('SaleTunnel')).toBeNull();
  });
});

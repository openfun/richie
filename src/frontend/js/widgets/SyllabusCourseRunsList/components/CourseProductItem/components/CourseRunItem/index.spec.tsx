import { faker } from '@faker-js/faker';
import { screen, getByText, render } from '@testing-library/react';
import { CredentialOrderFactory, ProductFactory } from 'utils/test/factories/joanie';
import type { CourseRun, CredentialOrder } from 'types/Joanie';
import { OrderState } from 'types/Joanie';
import CourseRunItem from '.';

jest.mock('../CourseProductCourseRuns', () => ({
  CourseRunList: ({ courseRuns }: { courseRuns: CourseRun[] }) => (
    <div data-testid={`CourseRunList-${courseRuns.map(({ id }) => id).join('-')}`} />
  ),
}));

describe('CourseRunItem', () => {
  it('does not allow user which purchase the product to enroll to course if order state is not validated', async () => {
    const order: CredentialOrder = CredentialOrderFactory({
      state: faker.helpers.arrayElement([OrderState.CANCELED, OrderState.PENDING]),
    }).one();
    const product = ProductFactory().one();
    product.contract_definition = undefined;

    const targetCourse = order.target_courses[0];

    render(<CourseRunItem targetCourse={targetCourse} order={order} product={product} />);

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

import { Meta, StoryObj } from '@storybook/react';
import { QueryClientProvider } from '@tanstack/react-query';
import fetchMock from 'fetch-mock';
import { StorybookHelper } from 'utils/StorybookHelper';
import {
  CourseLightFactory,
  CourseProductRelationFactory,
  CourseRunFactory,
  CredentialOrderFactory,
  CredentialProductFactory,
  EnrollmentFactory,
  TargetCourseFactory,
} from 'utils/test/factories/joanie';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import { UserFactory } from 'utils/test/factories/richie';
import { CredentialOrder, OrderState } from 'types/Joanie';
import { Maybe } from 'types/utils';
import CourseProductItem, { CourseProductItemProps } from '.';

const render = (args: CourseProductItemProps, options?: Maybe<{ order: CredentialOrder }>) => {
  fetchMock.get(`http://localhost:8071/api/v1.0/credit-cards/`, [], { overwriteRoutes: true });
  fetchMock.get(`http://localhost:8071/api/v1.0/orders/`, [], { overwriteRoutes: true });
  fetchMock.get(`http://localhost:8071/api/v1.0/addresses/`, [], { overwriteRoutes: true });
  fetchMock.get(
    `http://localhost:8071/api/v1.0/courses/${args.course.code}/products/${args.productId}/`,
    CourseProductRelationFactory({ product: CredentialProductFactory().one() }).one(),
    { overwriteRoutes: true },
  );
  fetchMock.get(
    `http://localhost:8071/api/v1.0/orders/?course_code=${args.course.code}&product_id=${args.productId}&state=pending&state=validated&state=submitted`,
    options?.order ? [options?.order] : [],
    { overwriteRoutes: true },
  );
  return StorybookHelper.wrapInApp(
    <QueryClientProvider client={createTestQueryClient({ user: UserFactory().one() })}>
      <CourseProductItem {...args} />
    </QueryClientProvider>,
  );
};

export default {
  component: CourseProductItem,
  parameters: {
    docs: {
      source: {
        code: 'Disabled for this story, see https://github.com/storybookjs/storybook/issues/11554',
      },
    },
  },
  args: {
    productId: 'AAA',
    course: CourseLightFactory({ code: 'BBB' }).one(),
  },
  render: (args) => render(args),
} as Meta<typeof CourseProductItem>;

type Story = StoryObj<typeof CourseProductItem>;

export const Default: Story = {};

export const WithPendingOrder: Story = {
  args: {
    productId: 'AAA',
    course: CourseLightFactory({ code: 'BBB' }).one(),
  },
  render: (args) =>
    render(args, { order: CredentialOrderFactory({ state: OrderState.PENDING }).one() }),
};

export const WithValidatedOrder: Story = {
  args: {
    productId: 'AAA',
    course: CourseLightFactory({ code: 'BBB' }).one(),
  },
  render: (args) => {
    const courseRunWithEnrollment = CourseRunFactory().one();
    return render(args, {
      order: CredentialOrderFactory({
        state: OrderState.VALIDATED,
        target_enrollments: EnrollmentFactory({
          is_active: true,
          course_run: courseRunWithEnrollment,
        }).many(1),
        target_courses: [
          TargetCourseFactory({
            course_runs: [courseRunWithEnrollment, ...CourseRunFactory().many(2)],
          }).one(),
          ...TargetCourseFactory().many(2),
        ],
      }).one(),
    });
  },
};

export const WithSubmittedOrder: Story = {
  args: {
    productId: 'AAA',
    course: CourseLightFactory({ code: 'BBB' }).one(),
  },
  render: (args) =>
    render(args, { order: CredentialOrderFactory({ state: OrderState.SUBMITTED }).one() }),
};

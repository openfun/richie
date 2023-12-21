import { Meta, StoryObj } from '@storybook/react';
import { CredentialOrder, OrderState, Product, TargetCourse } from 'types/Joanie';
import { QueryStateFactory } from 'utils/test/factories/reactQuery';
import {
  CredentialOrderFactory,
  EnrollmentFactory,
  ProductFactory,
  TargetCourseFactory,
} from 'utils/test/factories/joanie';
import { StorybookHelper } from 'utils/StorybookHelper';
import { OrderDetails } from '.';

const order: CredentialOrder = CredentialOrderFactory({ target_courses: [] }).one();
const product: Product = ProductFactory().one();
const targetsCourses: TargetCourse[] = TargetCourseFactory().many(3);
const enrollment = EnrollmentFactory().one();

export default {
  title: 'Widgets/Dashboard/Order/Writable',
  component: OrderDetails,
  parameters: {
    docs: {
      source: {
        code: 'Disabled for this story, see https://github.com/storybookjs/storybook/issues/11554',
      },
    },
  },
  render: (args) =>
    StorybookHelper.wrapInApp(<OrderDetails {...args} />, {
      queriesCallback: (queries) => {
        queries.push(QueryStateFactory(['product', order.product_id], { data: product }));
      },
    }),
} as Meta<typeof OrderDetails>;

type Story = StoryObj<typeof OrderDetails>;

export const StateOther: Story = {
  args: {
    order: { ...order, state: OrderState.CANCELED },
    showDetailsButton: false,
    writable: true,
  },
};

export const NoTargetCourses: Story = {
  args: { order, showDetailsButton: false, writable: true },
};

export const OneTargetCourse: Story = {
  args: {
    order: { ...order, target_courses: [targetsCourses[0]] },
    showDetailsButton: false,
    writable: true,
  },
};

export const MultipleTargetCourses: Story = {
  args: {
    order: {
      ...order,
      target_courses: [...targetsCourses, TargetCourseFactory({ course_runs: [] }).one()],
      target_enrollments: [
        {
          ...enrollment,
          course_run: { ...targetsCourses[1].course_runs[0] },
        },
        {
          ...enrollment,
          course_run: { ...targetsCourses[2].course_runs[2] },
        },
      ],
    },
    showDetailsButton: false,
    writable: true,
  },
};

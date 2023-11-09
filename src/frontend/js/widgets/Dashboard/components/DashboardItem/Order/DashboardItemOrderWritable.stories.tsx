import { Meta, StoryObj } from '@storybook/react';
import { CredentialOrder, OrderState, Product, TargetCourse } from 'types/Joanie';
import { QueryStateFactory } from 'utils/test/factories/reactQuery';
import {
  CredentialOrderFactory,
  ProductFactory,
  TargetCourseFactory,
} from 'utils/test/factories/joanie';
import { StorybookHelper } from 'utils/StorybookHelper';
import { enrollment } from '../stories.mock';
import { DashboardItemOrder } from './DashboardItemOrder';

const order: CredentialOrder = CredentialOrderFactory({ target_courses: [] }).one();
const product: Product = ProductFactory().one();
const targetsCourses: TargetCourse[] = TargetCourseFactory().many(3);

export default {
  title: 'Widgets/Dashboard/Order/Writable',
  component: DashboardItemOrder,
  parameters: {
    docs: {
      source: {
        code: 'Disabled for this story, see https://github.com/storybookjs/storybook/issues/11554',
      },
    },
  },
  render: (args) =>
    StorybookHelper.wrapInApp(<DashboardItemOrder {...args} />, {
      queriesCallback: (queries) => {
        queries.push(QueryStateFactory(['product', order.product_id], { data: product }));
      },
    }),
} as Meta<typeof DashboardItemOrder>;

type Story = StoryObj<typeof DashboardItemOrder>;

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

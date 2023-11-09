import { Meta, StoryObj } from '@storybook/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { CredentialOrder, OrderState, Product, TargetCourse } from 'types/Joanie';
import {
  CredentialOrderFactory,
  ProductFactory,
  TargetCourseFactory,
} from 'utils/test/factories/joanie';
import { QueryStateFactory } from 'utils/test/factories/reactQuery';
import { StorybookHelper } from 'utils/StorybookHelper';
import { enrollment } from '../stories.mock';
import { DashboardItemOrder } from './DashboardItemOrder';

const order: CredentialOrder = CredentialOrderFactory({ target_courses: [] }).one();
const product: Product = ProductFactory().one();
const targetsCourses: TargetCourse[] = TargetCourseFactory().many(3);

export default {
  title: 'Widgets/Dashboard/Order/Readonly',
  component: DashboardItemOrder,
  parameters: {
    docs: {
      source: {
        code: 'Disabled for this story, see https://github.com/storybookjs/storybook/issues/11554',
      },
    },
  },
  render: (args) =>
    StorybookHelper.wrapInApp(
      <RouterProvider
        router={createMemoryRouter([
          {
            index: true,
            element: <DashboardItemOrder {...args} />,
          },
        ])}
      />,
      {
        queriesCallback: (queries) => {
          queries.push(QueryStateFactory(['product', order.product_id], { data: product }));
        },
      },
    ),
} as Meta<typeof DashboardItemOrder>;

type Story = StoryObj<typeof DashboardItemOrder>;

export const StateOther: Story = {
  args: {
    order: { ...order, state: OrderState.CANCELED },
  },
};

export const NoTargetCourses: Story = {
  args: { order },
};

export const OneTargetCourse: Story = {
  args: { order: { ...order, target_courses: [targetsCourses[0]] } },
};

export const MultipleTargetCourses: Story = {
  args: {
    order: {
      ...order,
      target_courses: targetsCourses,
      target_enrollments: [
        {
          ...enrollment,
          course_run: { ...targetsCourses[1].course_runs[0] },
        },
      ],
    },
  },
};

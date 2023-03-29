import { ComponentMeta, ComponentStory } from '@storybook/react';
import { Order, OrderState, Product, TargetCourse } from 'types/Joanie';
import { QueryStateFactory } from 'utils/test/factories/reactQuery';
import { OrderFactory, ProductFactory, TargetCourseFactory } from 'utils/test/factories/joanie';
import { StorybookHelper } from 'utils/StorybookHelper';
import { enrollment } from '../mock.stories';
import { DashboardItemOrder } from './DashboardItemOrder';

const order: Order = { ...OrderFactory.generate(), target_courses: [] };
const product: Product = ProductFactory.generate();
const targetsCourses: TargetCourse[] = TargetCourseFactory.generate(3);

export default {
  title: 'Components/Dashboard/Order[Writable]',
  component: DashboardItemOrder,
} as ComponentMeta<typeof DashboardItemOrder>;

const Template: ComponentStory<typeof DashboardItemOrder> = (args) =>
  StorybookHelper.wrapInApp(<DashboardItemOrder {...args} />, {
    queriesCallback: (queries) => {
      queries.push(QueryStateFactory(['product', order.product], { data: product }));
    },
  });

const bind = () => {
  const bound = Template.bind({});
  bound.parameters = {
    docs: {
      source: {
        code: 'Disabled for this story, see https://github.com/storybookjs/storybook/issues/11554',
      },
    },
  };
  return bound;
};

export const StateOther = bind();
StateOther.args = {
  order: { ...order, state: OrderState.CANCELED },
  showDetailsButton: false,
  writable: true,
};

export const NoTargetCourses = bind();
NoTargetCourses.args = { order, showDetailsButton: false, writable: true };

export const OneTargetCourse = bind();
OneTargetCourse.args = {
  order: { ...order, target_courses: [targetsCourses[0]] },
  showDetailsButton: false,
  writable: true,
};

export const MultipleTargetCourses = bind();
MultipleTargetCourses.args = {
  order: {
    ...order,
    target_courses: [...targetsCourses, { ...TargetCourseFactory.generate(), course_runs: [] }],
    enrollments: [
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
};

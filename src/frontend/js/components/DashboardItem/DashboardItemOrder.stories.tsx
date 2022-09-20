import { ComponentMeta, ComponentStory } from '@storybook/react';
import { Order, OrderState } from 'types/Joanie';
import { OrderFactory } from 'utils/test/factories';
import { DashboardItemOrder } from './DashboardItemOrder';
import { enrollment } from './mock.stories';

const order: Order = OrderFactory.generate();

export default {
  title: 'Components/Dashboard/Order',
  component: DashboardItemOrder,
} as ComponentMeta<typeof DashboardItemOrder>;

const Template: ComponentStory<typeof DashboardItemOrder> = (args) => (
  <DashboardItemOrder {...args} />
);

export const StateCompleted = Template.bind({});
StateCompleted.args = {
  order: { ...order, state: OrderState.VALIDATED, certificate: 'certificate' },
};

export const StateOther = Template.bind({});
StateOther.args = { order: { ...order, state: OrderState.CANCELED } };

export const NoEnrollments = Template.bind({});
NoEnrollments.args = { order };

export const OneEnrollment = Template.bind({});
OneEnrollment.args = { order: { ...order, enrollments: [enrollment] } };

export const MultipleEnrollments = Template.bind({});
MultipleEnrollments.args = {
  order: {
    ...order,
    enrollments: [
      enrollment,
      { ...enrollment, is_active: false, id: '2' },
      {
        ...enrollment,
        id: '3',
        course_run: { ...enrollment.course_run, end: '2029-10-01T01:23:37+00:00' },
      },
    ],
  },
};

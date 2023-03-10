import { ComponentMeta, ComponentStory } from '@storybook/react';
import { enrollment } from '../mock.stories';
import { DashboardItemEnrollment } from './DashboardItemEnrollment';

export default {
  title: 'Components/Dashboard/Enrollment',
  component: DashboardItemEnrollment,
} as ComponentMeta<typeof DashboardItemEnrollment>;

const Template: ComponentStory<typeof DashboardItemEnrollment> = (args) => (
  <DashboardItemEnrollment {...args} />
);

export const Opened = Template.bind({});
Opened.args = {
  enrollment: {
    ...enrollment,
    course_run: { ...enrollment.course_run, end: '2029-10-01T01:23:37+00:00' },
  },
};

export const Closed = Template.bind({});
Closed.args = {
  enrollment: {
    ...enrollment,
    course_run: { ...enrollment.course_run, end: '2021-10-01T01:23:37+00:00' },
  },
};

export const NotActive = Template.bind({});
NotActive.args = { enrollment: { ...enrollment, is_active: false } };

import { Meta, StoryObj } from '@storybook/react';
import { enrollment } from '../stories.mock';
import { DashboardItemEnrollment } from './DashboardItemEnrollment';

export default {
  component: DashboardItemEnrollment,
} as Meta<typeof DashboardItemEnrollment>;

type Story = StoryObj<typeof DashboardItemEnrollment>;

export const Opened: Story = {
  args: {
    enrollment: {
      ...enrollment,
      course_run: { ...enrollment.course_run, end: '2029-10-01T01:23:37+00:00' },
    },
  },
};

export const Closed: Story = {
  args: {
    enrollment: {
      ...enrollment,
      course_run: { ...enrollment.course_run, end: '2021-10-01T01:23:37+00:00' },
    },
  },
};

export const NotActive: Story = {
  args: { enrollment: { ...enrollment, is_active: false } },
};

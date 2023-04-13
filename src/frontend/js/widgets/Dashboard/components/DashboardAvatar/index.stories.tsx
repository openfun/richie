import { Meta, StoryObj } from '@storybook/react';
import { UserFactory } from 'utils/test/factories/richie';
import { DashboardAvatar } from '.';

export default {
  component: DashboardAvatar,
} as Meta<typeof DashboardAvatar>;

type Story = StoryObj<typeof DashboardAvatar>;

export const Default: Story = {
  args: {
    user: UserFactory.generate(),
  },
};

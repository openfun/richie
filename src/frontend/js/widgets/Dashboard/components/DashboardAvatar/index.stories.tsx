import { Meta, StoryObj } from '@storybook/react';
import { UserFactory } from 'utils/test/factories/richie';
import { OrganizationFactory } from 'utils/test/factories/joanie';
import { DashboardAvatar, DashboardAvatarVariantEnum } from '.';

export default {
  component: DashboardAvatar,
} as Meta<typeof DashboardAvatar>;

type Story = StoryObj<typeof DashboardAvatar>;

export const Default: Story = {
  args: {
    title: UserFactory().one().username,
  },
};

export const Organization: Story = {
  args: {
    title: OrganizationFactory().one().title,
    variant: DashboardAvatarVariantEnum.SQUARE,
  },
};

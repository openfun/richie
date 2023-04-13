import type { Meta, StoryObj } from '@storybook/react';
import Banner, { BannerType } from './index';

export default {
  component: Banner,
  args: {
    message: 'Hello world',
  },
} as Meta<typeof Banner>;

type Story = StoryObj<typeof Banner>;

export const Error: Story = {
  args: {
    type: BannerType.ERROR,
  },
};

export const Info: Story = {
  args: {
    type: BannerType.INFO,
  },
};

export const Success: Story = {
  args: {
    type: BannerType.SUCCESS,
  },
};

export const Warning: Story = {
  args: {
    type: BannerType.WARNING,
  },
};

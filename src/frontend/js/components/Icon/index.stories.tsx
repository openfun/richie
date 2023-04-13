import { Meta, StoryObj } from '@storybook/react';
import { Icon } from './index';

export default {
  component: Icon,
} as Meta<typeof Icon>;

type Story = StoryObj<typeof Icon>;

export const Default: Story = {
  args: {
    name: 'icon-check',
  },
};

import { Meta, StoryObj } from '@storybook/react';
import { Button } from './index';

export default {
  component: Button,
  args: {
    children: 'Click me',
    color: 'primary',
  },
} as Meta<typeof Button>;

type Story = StoryObj<typeof Button>;

export const Default: Story = {};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const Link: Story = {
  args: {
    href: 'https://www.fun-mooc.fr/',
  },
};

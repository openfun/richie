import { StoryObj, Meta } from '@storybook/react';
import { Spinner } from './index';

export default {
  component: Spinner,
  argTypes: {
    theme: {
      control: 'inline-radio',
      options: [undefined, 'light'],
    },
  },
} as Meta<typeof Spinner>;

type Story = StoryObj<typeof Spinner>;

export const Small: Story = {
  args: {
    size: 'small',
  },
};

export const Large: Story = {
  args: {
    size: 'large',
  },
};

import type { Meta, StoryObj } from '@storybook/react';
import Badge from '.';

export default {
  component: Badge,
  args: {
    children: '999',
  },
  render: (args) => {
    return (
      <div style={{ display: 'flex' }}>
        <Badge {...args} />
      </div>
    );
  },
} as Meta<typeof Badge>;

type Story = StoryObj<typeof Badge>;

export const Default: Story = {
  args: {},
};

import { Meta, StoryObj } from '@storybook/react';
import { StorybookHelper } from 'utils/StorybookHelper';
import { DashboardCreateAddress } from './DashboardCreateAddress';

export default {
  component: DashboardCreateAddress,
  parameters: {
    docs: {
      source: {
        code: 'Disabled for this story, see https://github.com/storybookjs/storybook/issues/11554',
      },
    },
  },
  render: (args) => {
    return StorybookHelper.wrapInApp(
      <div style={{ width: '600px' }}>
        <DashboardCreateAddress {...args} />
      </div>,
    );
  },
} as Meta<typeof DashboardCreateAddress>;

type Story = StoryObj<typeof DashboardCreateAddress>;

export const Default: Story = {};

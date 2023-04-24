import { Meta, StoryObj } from '@storybook/react';
import { StorybookHelper } from 'utils/StorybookHelper';
import { AddressFactory } from 'utils/test/factories/joanie';
import { DashboardEditAddress } from './DashboardEditAddress';

export default {
  component: DashboardEditAddress,
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
        <DashboardEditAddress {...args} />
      </div>,
    );
  },
} as Meta<typeof DashboardEditAddress>;

type Story = StoryObj<typeof DashboardEditAddress>;

export const Default: Story = {
  args: {
    address: AddressFactory().one(),
  },
};

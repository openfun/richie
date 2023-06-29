import { Meta, StoryObj } from '@storybook/react';
import { StorybookHelper } from 'utils/StorybookHelper';
import { AddressFactory } from 'utils/test/factories/joanie';
import RegisteredAddress from '.';

export default {
  component: RegisteredAddress,
  parameters: {
    docs: {
      source: {
        code: 'Disabled for this story, see https://github.com/storybookjs/storybook/issues/11554',
      },
    },
  },
  args: {
    address: AddressFactory().one(),
  },
  render: (args) => {
    return StorybookHelper.wrapInApp(
      <div className="SaleTunnel__modal modal" style={{ width: '600px' }}>
        <div className="AddressesManagement">
          <div className="address-form">
            <RegisteredAddress {...args} />
            <RegisteredAddress {...args} address={{ ...args.address, is_main: false }} />
            <RegisteredAddress {...args} address={{ ...args.address, is_main: false }} />
          </div>
        </div>
      </div>,
    );
  },
} as Meta<typeof RegisteredAddress>;

type Story = StoryObj<typeof RegisteredAddress>;

export const Default: Story = {};
export const MainAddress: Story = {
  args: {
    address: AddressFactory({ is_main: true }).one(),
  },
};

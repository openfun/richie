import { Meta, StoryObj } from '@storybook/react';
import { StorybookHelper } from 'utils/StorybookHelper';
import { AddressFactory } from 'utils/test/factories/joanie';
import AddressForm from '.';

export default {
  component: AddressForm,
  parameters: {
    docs: {
      source: {
        code: 'Disabled for this story, see https://github.com/storybookjs/storybook/issues/11554',
      },
    },
  },
  render: (args) => {
    return StorybookHelper.wrapInApp(
      <div className="SaleTunnel__modal">
        <div className="AddressesManagement" style={{ width: '600px' }}>
          <div className="address-form">
            <AddressForm {...args} />,
          </div>
        </div>
      </div>,
    );
  },
} as Meta<typeof AddressForm>;

type Story = StoryObj<typeof AddressForm>;

export const CreateAddress: Story = {};

export const EditAddress: Story = {
  args: {
    address: AddressFactory().one(),
  },
};

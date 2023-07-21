import { Meta, StoryObj } from '@storybook/react';
import { StorybookHelper } from 'utils/StorybookHelper';
import { RichieContextFactory } from 'utils/test/factories/richie';
import AddressesManagement from '.';

export default {
  component: AddressesManagement,
  parameters: {
    docs: {
      source: {
        code: 'Disabled for this story, see https://github.com/storybookjs/storybook/issues/11554',
      },
    },
  },
  args: {
    context: RichieContextFactory().one(),
    profileUrls: {
      first_entry: { action: () => {}, label: 'First entry' },
      second_entry: { action: () => {}, label: 'Second entry' },
    },
  },
  render: (args) => {
    return StorybookHelper.wrapInApp(<AddressesManagement {...args} />);
  },
} as Meta<typeof AddressesManagement>;

type Story = StoryObj<typeof AddressesManagement>;

export const Default: Story = {};

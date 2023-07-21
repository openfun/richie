import { Meta, StoryObj } from '@storybook/react';
import { StorybookHelper } from 'utils/StorybookHelper';
import { RichieContextFactory } from 'utils/test/factories/richie';
import UserLogin from '.';

export default {
  component: UserLogin,
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
    return StorybookHelper.wrapInApp(<UserLogin {...args} />);
  },
} as Meta<typeof UserLogin>;

type Story = StoryObj<typeof UserLogin>;

export const Default: Story = {};

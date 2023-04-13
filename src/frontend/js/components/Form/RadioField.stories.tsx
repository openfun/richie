import { Meta, StoryObj } from '@storybook/react';
import { defaultConfig } from './Field.stories.config';
import { RadioField } from './index';

export default {
  component: RadioField,
  ...defaultConfig,
  render: (args) => (
    <div>
      <RadioField {...args} value="French" id="French" name="input" />
      <RadioField {...args} value="German" id="German" name="input" />
    </div>
  ),
} as Meta<typeof RadioField>;

type Story = StoryObj<typeof RadioField>;

export const Default: Story = {};

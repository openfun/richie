import { Meta, StoryObj } from '@storybook/react';
import { defaultConfig } from './Field.stories.config';
import { SelectField } from './index';

const choices = ['French', 'Spanish', 'German', 'English'];

export default {
  component: SelectField,
  ...defaultConfig,
  render: (args) => (
    <SelectField {...args}>
      {choices.map((choice) => (
        <option value={choice} key={'option-' + choice}>
          {choice}
        </option>
      ))}
    </SelectField>
  ),
} as Meta<typeof SelectField>;

type Story = StoryObj<typeof SelectField>;

export const Default: Story = {
  args: {
    defaultValue: 'German',
  },
};

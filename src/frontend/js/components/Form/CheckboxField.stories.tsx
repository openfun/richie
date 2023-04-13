import { Meta, StoryObj } from '@storybook/react';
import { defaultConfig } from './Field.stories.config';
import { CheckboxField } from './index';

export default {
  component: CheckboxField,
  ...defaultConfig,
} as Meta<typeof CheckboxField>;

type Story = StoryObj<typeof CheckboxField>;

export const Default: Story = {};

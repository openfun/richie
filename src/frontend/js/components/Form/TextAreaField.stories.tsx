import { Meta, StoryObj } from '@storybook/react';
import { defaultConfig } from './Field.stories.config';
import { TextareaField } from './index';

export default {
  component: TextareaField,
  ...defaultConfig,
} as Meta<typeof TextareaField>;

type Story = StoryObj<typeof TextareaField>;

export const Default: Story = {};

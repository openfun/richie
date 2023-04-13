import { Meta, StoryObj } from '@storybook/react';
import { defaultConfig } from './Field.stories.config';
import { TextField } from './index';

export default {
  component: TextField,
  ...defaultConfig,
} as Meta<typeof TextField>;

type Story = StoryObj<typeof TextField>;

export const Default: Story = {};

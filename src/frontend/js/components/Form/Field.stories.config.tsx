import { Meta } from '@storybook/react';

export const defaultConfig: Partial<Meta> = {
  args: {
    label: 'Any label here',
    message: 'Any message here',
    fieldClasses: [],
    id: 'id',
  },
  argTypes: {
    disabled: {
      control: 'boolean',
    },
    error: {
      control: 'boolean',
    },
    message: {
      control: 'text',
    },
    required: {
      control: 'boolean',
    },
  },
};

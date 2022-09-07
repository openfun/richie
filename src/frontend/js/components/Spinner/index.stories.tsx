import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';
import { Spinner } from './index';

export default {
  title: 'Components/Spinner',
  component: Spinner,
  argTypes: {
    theme: {
      control: 'inline-radio',
      options: [undefined, 'light'],
    },
  },
} as ComponentMeta<typeof Spinner>;

const Template: ComponentStory<typeof Spinner> = (args) => <Spinner {...args} />;

export const Small = Template.bind({});
Small.args = {
  size: 'small',
};

export const Large = Template.bind({});
Large.args = {
  size: 'large',
};

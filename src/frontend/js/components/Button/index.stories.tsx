import { ComponentMeta, ComponentStory } from '@storybook/react';
import { Button } from './index';

export default {
  title: 'Components/Button',
  component: Button,
  args: {
    children: 'Click me',
    color: 'primary',
  },
} as ComponentMeta<typeof Button>;

const Template: ComponentStory<typeof Button> = (args) => <Button {...args} />;

export const Default = Template.bind({});
Default.args = {};

export const Disabled = Template.bind({});
Disabled.args = {
  disabled: true,
};

export const Link = Template.bind({});
Link.args = {
  href: 'https://www.fun-mooc.fr/',
};

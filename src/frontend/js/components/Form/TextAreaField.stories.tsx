import { ComponentMeta, ComponentStory } from '@storybook/react';
import { TextareaField as Base } from './index';
import { defaultConfig } from './Field.stories';

export default {
  title: 'Components/Inputs',
  component: Base,
  ...defaultConfig,
} as ComponentMeta<typeof Base>;

const Template: ComponentStory<typeof Base> = (args) => <Base {...args} />;

export const TextareaField = Template.bind({});

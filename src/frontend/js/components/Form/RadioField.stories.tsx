import { ComponentMeta, ComponentStory } from '@storybook/react';
import { defaultConfig } from './Field.stories';
import { RadioField as Base } from './index';

export default {
  title: 'Components/Inputs',
  component: Base,
  ...defaultConfig,
} as ComponentMeta<typeof Base>;

const Template: ComponentStory<typeof Base> = (args) => (
  <div>
    <Base {...args} value="French" id="French" name="input" />
    <Base {...args} value="German" id="German" name="input" />
  </div>
);

export const RadioField = Template.bind({});

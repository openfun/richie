import { ComponentMeta, ComponentStory } from '@storybook/react';
import { defaultConfig } from './Field.stories';
import { SelectField as Base } from './index';

export default {
  title: 'Components/Inputs',
  component: Base,
  ...defaultConfig,
} as ComponentMeta<typeof Base>;

const choices = ['French', 'Spanish', 'German', 'English'];

const Template: ComponentStory<typeof Base> = (args) => (
  <Base {...args}>
    {choices.map((choice) => (
      <option value={choice} key={'option-' + choice}>
        {choice}
      </option>
    ))}
  </Base>
);

export const SelectField = Template.bind({});
SelectField.args = {
  defaultValue: 'German',
};

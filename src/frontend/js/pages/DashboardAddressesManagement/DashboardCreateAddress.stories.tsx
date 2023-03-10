import { ComponentMeta, ComponentStory } from '@storybook/react';
import { StorybookHelper } from 'utils/StorybookHelper';
import { DashboardCreateAddress } from './DashboardCreateAddress';

export default {
  title: 'Components/DashboardCreateAddress',
  component: DashboardCreateAddress,
} as ComponentMeta<typeof DashboardCreateAddress>;

const Template: ComponentStory<typeof DashboardCreateAddress> = (args) => {
  return StorybookHelper.wrapInApp(
    <div style={{ width: '600px' }}>
      <DashboardCreateAddress {...args} />
    </div>,
  );
};

export const Default = Template.bind({});
Default.args = {};
Default.parameters = {
  docs: {
    source: {
      code: 'Disabled for this story, see https://github.com/storybookjs/storybook/issues/11554',
    },
  },
};

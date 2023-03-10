import { ComponentMeta, ComponentStory } from '@storybook/react';
import { StorybookHelper } from 'utils/StorybookHelper';
import { DashboardAddressesManagement } from './index';

export default {
  title: 'Components/DashboardAddressesManagement',
  component: DashboardAddressesManagement,
} as ComponentMeta<typeof DashboardAddressesManagement>;

const Template: ComponentStory<typeof DashboardAddressesManagement> = () => {
  return StorybookHelper.wrapInApp(
    <div style={{ width: '600px' }}>
      <DashboardAddressesManagement />
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

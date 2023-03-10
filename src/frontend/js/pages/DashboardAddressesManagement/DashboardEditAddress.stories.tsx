import { ComponentMeta, ComponentStory } from '@storybook/react';
import { StorybookHelper } from 'utils/StorybookHelper';
import { AddressFactory } from 'utils/test/factories';
import { DashboardEditAddress } from './DashboardEditAddress';

export default {
  title: 'Components/DashboardEditAddress',
  component: DashboardEditAddress,
} as ComponentMeta<typeof DashboardEditAddress>;

const Template: ComponentStory<typeof DashboardEditAddress> = (args) => {
  return StorybookHelper.wrapInApp(
    <div style={{ width: '600px' }}>
      <DashboardEditAddress {...args} />
    </div>,
  );
};

export const Default = Template.bind({});
Default.args = {
  address: AddressFactory.generate(),
};
Default.parameters = {
  docs: {
    source: {
      code: 'Disabled for this story, see https://github.com/storybookjs/storybook/issues/11554',
    },
  },
};

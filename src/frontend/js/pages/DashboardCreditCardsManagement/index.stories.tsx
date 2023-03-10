import { ComponentMeta, ComponentStory } from '@storybook/react';
import { StorybookHelper } from 'utils/StorybookHelper';
import { DashboardCreditCardsManagement } from '.';

export default {
  title: 'Components/DashboardCreditCardsManagement',
  component: DashboardCreditCardsManagement,
} as ComponentMeta<typeof DashboardCreditCardsManagement>;

const Template: ComponentStory<typeof DashboardCreditCardsManagement> = () => {
  return StorybookHelper.wrapInApp(<DashboardCreditCardsManagement />);
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

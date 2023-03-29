import { ComponentMeta, ComponentStory } from '@storybook/react';
import { StorybookHelper } from 'utils/StorybookHelper';
import { CreditCardFactory } from 'utils/test/factories/joanie';
import { DashboardEditCreditCard } from './DashboardEditCreditCard';

export default {
  title: 'Components/DashboardEditCreditCard',
  component: DashboardEditCreditCard,
} as ComponentMeta<typeof DashboardEditCreditCard>;

const Template: ComponentStory<typeof DashboardEditCreditCard> = (args) => {
  return StorybookHelper.wrapInApp(<DashboardEditCreditCard {...args} />);
};

export const Default = Template.bind({});
Default.args = {
  creditCard: CreditCardFactory.generate(),
};
Default.parameters = {
  docs: {
    source: {
      code: 'Disabled for this story, see https://github.com/storybookjs/storybook/issues/11554',
    },
  },
};

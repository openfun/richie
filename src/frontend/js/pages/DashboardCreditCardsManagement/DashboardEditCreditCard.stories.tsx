import { Meta, StoryObj } from '@storybook/react';
import { StorybookHelper } from 'utils/StorybookHelper';
import { CreditCardFactory } from 'utils/test/factories/joanie';
import { DashboardEditCreditCard } from './DashboardEditCreditCard';

export default {
  component: DashboardEditCreditCard,
  parameters: {
    docs: {
      source: {
        code: 'Disabled for this story, see https://github.com/storybookjs/storybook/issues/11554',
      },
    },
  },
  render: (args) => {
    return StorybookHelper.wrapInApp(<DashboardEditCreditCard {...args} />);
  },
} as Meta<typeof DashboardEditCreditCard>;

type Story = StoryObj<typeof DashboardEditCreditCard>;

export const Default: Story = {
  args: {
    creditCard: CreditCardFactory().one(),
  },
};

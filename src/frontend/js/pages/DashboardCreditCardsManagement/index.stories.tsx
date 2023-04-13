import { Meta, StoryObj } from '@storybook/react';
import { StorybookHelper } from 'utils/StorybookHelper';
import { DashboardCreditCardsManagement } from '.';

export default {
  component: DashboardCreditCardsManagement,
  parameters: {
    docs: {
      source: {
        code: 'Disabled for this story, see https://github.com/storybookjs/storybook/issues/11554',
      },
    },
  },
  render: () => {
    return StorybookHelper.wrapInApp(<DashboardCreditCardsManagement />);
  },
} as Meta<typeof DashboardCreditCardsManagement>;

type Story = StoryObj<typeof DashboardCreditCardsManagement>;

export const Default: Story = {};

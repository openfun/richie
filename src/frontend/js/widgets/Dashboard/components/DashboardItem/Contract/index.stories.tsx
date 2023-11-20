import { Meta, StoryObj } from '@storybook/react';
import { DashboardItemContract } from 'widgets/Dashboard/components/DashboardItem/Contract/index';
import { StorybookHelper } from 'utils/StorybookHelper';
import { Contract } from 'types/Joanie';
import { ContractFactory } from 'utils/test/factories/joanie';

export default {
  title: 'Widgets/Dashboard/Contract',
  component: DashboardItemContract,
  parameters: {
    docs: {
      source: {
        code: 'Disabled for this story, see https://github.com/storybookjs/storybook/issues/11554',
      },
    },
  },
  render: (args) => StorybookHelper.wrapInApp(<DashboardItemContract {...args} />),
} as Meta<typeof DashboardItemContract>;

type Story = StoryObj<typeof DashboardItemContract>;

const contract: Contract = ContractFactory().one();

export const Default: Story = {
  args: {
    contract,
  },
};

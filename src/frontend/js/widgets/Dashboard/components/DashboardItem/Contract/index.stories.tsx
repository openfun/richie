import { Meta, StoryObj } from '@storybook/react';
import { DashboardItemContract } from 'widgets/Dashboard/components/DashboardItem/Contract/index';
import { StorybookHelper } from 'utils/StorybookHelper';
import { Contract, NestedCredentialOrder } from 'types/Joanie';
import { ContractFactory, NestedCredentialOrderFactory } from 'utils/test/factories/joanie';

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

const contract: Contract = ContractFactory({
  order: NestedCredentialOrderFactory().one(),
}).one();

export const Default: Story = {
  args: {
    contract,
    title: contract.order.product_title,
    order: contract.order as NestedCredentialOrder,
    contract_definition: contract.definition,
    writable: true,
  },
};

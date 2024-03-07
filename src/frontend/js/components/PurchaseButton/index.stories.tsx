import { Meta, StoryObj } from '@storybook/react';
import { ProductFactory } from 'utils/test/factories/joanieLegacy';
import PurchaseButton from '.';

export default {
  component: PurchaseButton,
  render: (args) => <PurchaseButton {...args} />,
  args: {
    product: ProductFactory().one(),
  },
} as Meta<typeof PurchaseButton>;

type Story = StoryObj<typeof PurchaseButton>;

export const Default: Story = {};

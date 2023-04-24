import { Meta, StoryObj } from '@storybook/react';
import { CreditCardFactory } from 'utils/test/factories/joanie';
import { CreditCard, CreditCardBrand } from 'types/Joanie';
import { CreditCardBrandLogo } from './CreditCardBrandLogo';

export default {
  component: CreditCardBrandLogo,
  render: (args) => <CreditCardBrandLogo {...args} />,
} as Meta<typeof CreditCardBrandLogo>;

type Story = StoryObj<typeof CreditCardBrandLogo>;

const creditCard: CreditCard = CreditCardFactory().one();

export const Visa: Story = {
  args: {
    creditCard: { ...creditCard, brand: CreditCardBrand.VISA },
  },
};

export const Mastercard: Story = {
  args: {
    creditCard: { ...creditCard, brand: CreditCardBrand.MASTERCARD },
  },
};

export const Maestro: Story = {
  args: {
    creditCard: { ...creditCard, brand: CreditCardBrand.MAESTRO },
  },
};

export const CB: Story = {
  args: {
    creditCard: { ...creditCard, brand: CreditCardBrand.CB },
  },
};

import { StoryObj, Meta } from '@storybook/react';
import { BaseJoanieAppWrapper } from 'utils/test/wrappers/BaseJoanieAppWrapper';
import {
  CertificateProductFactory,
  EnrollmentFactory,
  OfferingFactory,
  ProductFactory,
} from 'utils/test/factories/joanie';
import { PacedCourseFactory } from 'utils/test/factories/richie';
import { SaleTunnel, SaleTunnelProps } from './index';

export default {
  // component: SaleTunnel,
  render: (props?: SaleTunnelProps) => {
    const defaultProps: SaleTunnelProps = {
      isOpen: true,
      product: ProductFactory().one(),
      onClose: () => {},
      course: PacedCourseFactory().one(),
      isWithdrawable: true,
      // enrollment?: Enrollment;
      // product: CredentialProduct | CertificateProduct;
      // onFinish?: (order: Order) => void;
    };
    return (
      <BaseJoanieAppWrapper>
        <SaleTunnel {...{ ...defaultProps, ...props }} />
      </BaseJoanieAppWrapper>
    );
  },
  // argTypes: {},
} as Meta<typeof SaleTunnel>;

type Story = StoryObj<typeof SaleTunnel>;

export const Credential: Story = {
  args: {},
};

export const CertificateDiscount: Story = {
  args: {
    product: CertificateProductFactory({ price: 100, price_currency: 'EUR' }).one(),
    course: PacedCourseFactory().one(),
    enrollment: EnrollmentFactory({
      offerings: OfferingFactory({ rules: { discounted_price: 80 } }).many(1),
    }).one(),
  },
};

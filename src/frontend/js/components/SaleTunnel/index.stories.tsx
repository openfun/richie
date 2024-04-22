import { StoryObj, Meta } from '@storybook/react';
import { BaseJoanieAppWrapper } from 'utils/test/wrappers/BaseJoanieAppWrapper';
import { CourseFactory, ProductFactory } from 'utils/test/factories/joanie';
import { SaleTunnel, SaleTunnelProps } from './index';

export default {
  // component: SaleTunnel,
  render: (props?: SaleTunnelProps) => {
    const defaultProps: SaleTunnelProps = {
      isOpen: true,
      product: ProductFactory().one(),
      onClose: () => {},
      course: CourseFactory().one(),
      // enrollment?: Enrollment;
      // product: CredentialProduct | CertificateProduct;
      // orderGroup?: OrderGroup;
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

export const Default: Story = {
  args: {},
};

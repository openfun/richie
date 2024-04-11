import { CredentialProduct } from 'types/Joanie';
import { GenericSaleTunnel } from 'components/SaleTunnelV2/GenericSaleTunnel';
import { ProductPath } from 'components/SaleTunnelV2/ProductPath';
import { SaleTunnelV2Props } from 'components/SaleTunnelV2/index';
import { GenericPaymentButton } from 'components/SaleTunnelV2/GenericPaymentButton';

interface CredentialSaleTunnelProps extends Omit<SaleTunnelV2Props, 'product'> {
  product: CredentialProduct;
}

export const CredentialSaleTunnel = (props: CredentialSaleTunnelProps) => {
  return (
    <GenericSaleTunnel
      {...props}
      asideNode={<ProductPath product={props.product} />}
      paymentNode={<CredentialPaymentButton {...props} />}
    />
  );
};

const CredentialPaymentButton = ({ product, course, orderGroup }: CredentialSaleTunnelProps) => {
  return (
    <GenericPaymentButton
      eventKey={`${course!.code}+${product.id}`}
      buildOrderPayload={(payload) => {
        return {
          ...payload,
          course_code: course!.code,
          ...(orderGroup ? { order_group_id: orderGroup.id } : {}),
        };
      }}
    />
  );
};

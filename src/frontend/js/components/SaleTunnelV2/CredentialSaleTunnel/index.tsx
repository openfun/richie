import { CredentialProduct } from 'types/Joanie';
import { GenericSaleTunnel } from 'components/SaleTunnelV2/GenericSaleTunnel';
import { SaleTunnelV2Props } from 'components/SaleTunnelV2/index';
import { GenericPaymentButton } from 'components/SaleTunnelV2/GenericPaymentButton';
import { CredentialProductPath } from 'components/SaleTunnelV2/CredentialSaleTunnel/CredentialProductPath';

interface CredentialSaleTunnelProps extends Omit<SaleTunnelV2Props, 'product'> {
  product: CredentialProduct;
}

export const CredentialSaleTunnel = (props: CredentialSaleTunnelProps) => {
  return (
    <GenericSaleTunnel
      {...props}
      eventKey={`${props.course!.code}+${props.product.id}`}
      asideNode={<CredentialProductPath product={props.product} />}
      paymentNode={<CredentialPaymentButton {...props} />}
    />
  );
};

const CredentialPaymentButton = ({
  course,
  orderGroup,
}: Pick<CredentialSaleTunnelProps, 'course' | 'orderGroup'>) => {
  return (
    <GenericPaymentButton
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

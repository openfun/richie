import { CredentialProduct } from 'types/Joanie';
import { GenericSaleTunnel } from 'components/SaleTunnel/GenericSaleTunnel';
import { SaleTunnelProps } from 'components/SaleTunnel/index';
import { GenericPaymentButton } from 'components/SaleTunnel/GenericPaymentButton';
import { CredentialProductPath } from 'components/SaleTunnel/CredentialSaleTunnel/CredentialProductPath';

interface CredentialSaleTunnelProps extends Omit<SaleTunnelProps, 'product'> {
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

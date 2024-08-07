import { CredentialProduct } from 'types/Joanie';
import { GenericSaleTunnel } from 'components/SaleTunnel/GenericSaleTunnel';
import { SaleTunnelProps } from 'components/SaleTunnel/index';
import { CredentialProductPath } from 'components/SaleTunnel/CredentialSaleTunnel/CredentialProductPath';
import SubscriptionButton from 'components/SaleTunnel/SubscriptionButton';

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
}: Pick<CredentialSaleTunnelProps, 'course' | 'orderGroup'>) => {
  return (
    <SubscriptionButton
      buildOrderPayload={(payload) => ({
        ...payload,
        course_code: course!.code,
      })}
    />
  );
};

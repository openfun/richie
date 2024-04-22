import { SaleTunnelProps } from 'components/SaleTunnel/index';
import { CertificateProduct } from 'types/Joanie';
import { GenericSaleTunnel } from 'components/SaleTunnel/GenericSaleTunnel';
import { GenericPaymentButton } from 'components/SaleTunnel/GenericPaymentButton';
import { CertificateProductPath } from 'components/SaleTunnel/CertificateSaleTunnel/CertificateProductPath';

interface CertificateSaleTunnelProps extends Omit<SaleTunnelProps, 'product'> {
  product: CertificateProduct;
}

export const CertificateSaleTunnel = (props: CertificateSaleTunnelProps) => {
  return (
    <GenericSaleTunnel
      {...props}
      eventKey={`${props.enrollment!.id}+${props.product.id}`}
      asideNode={<CertificateProductPath product={props.product} enrollment={props.enrollment!} />}
      paymentNode={<CertificatePaymentButton {...props} />}
    />
  );
};

const CertificatePaymentButton = ({
  enrollment,
}: Pick<CertificateSaleTunnelProps, 'enrollment'>) => {
  return (
    <GenericPaymentButton
      buildOrderPayload={(payload) => {
        return {
          ...payload,
          enrollment_id: enrollment!.id,
        };
      }}
    />
  );
};

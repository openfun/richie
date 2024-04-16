import { SaleTunnelV2Props } from 'components/SaleTunnelV2/index';
import { CertificateProduct } from 'types/Joanie';
import { GenericSaleTunnel } from 'components/SaleTunnelV2/GenericSaleTunnel';
import { GenericPaymentButton } from 'components/SaleTunnelV2/GenericPaymentButton';
import { CertificateProductPath } from 'components/SaleTunnelV2/CertificateSaleTunnel/CertificateProductPath';

interface CertificateSaleTunnelProps extends Omit<SaleTunnelV2Props, 'product'> {
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

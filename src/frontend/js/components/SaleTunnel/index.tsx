import { ModalProps } from '@openfun/cunningham-react';
import {
  CertificateProduct,
  CourseLight,
  CredentialProduct,
  Enrollment,
  Order,
  OrderGroup,
  Organization,
  Product,
  ProductType,
} from 'types/Joanie';
import { CredentialSaleTunnel } from 'components/SaleTunnel/CredentialSaleTunnel';
import { CertificateSaleTunnel } from 'components/SaleTunnel/CertificateSaleTunnel';
import { PacedCourse } from 'types';

export interface SaleTunnelProps extends Pick<ModalProps, 'isOpen' | 'onClose'> {
  product: Product;
  organizations?: Organization[];
  isWithdrawable: boolean;
  course?: PacedCourse | CourseLight;
  enrollment?: Enrollment;
  orderGroup?: OrderGroup;
  onFinish?: (order: Order) => void;
}

/**
 * This is just a simple wrapper that will render the correct SaleTunnel based on the product type.
 */
export const SaleTunnel = (props: SaleTunnelProps) => {
  return (
    <>
      {props.product.type === ProductType.CREDENTIAL && (
        <CredentialSaleTunnel {...props} product={props.product as CredentialProduct} />
      )}
      {props.product.type === ProductType.CERTIFICATE && (
        <CertificateSaleTunnel {...props} product={props.product as CertificateProduct} />
      )}
    </>
  );
};

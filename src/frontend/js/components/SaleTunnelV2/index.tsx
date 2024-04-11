import { ModalProps } from '@openfun/cunningham-react';
import { ReactNode } from 'react';
import {
  CourseLight,
  CredentialProduct,
  Enrollment,
  Order,
  OrderGroup,
  Product,
  ProductType,
} from 'types/Joanie';
import { CredentialSaleTunnel } from 'components/SaleTunnelV2/CredentialSaleTunnel';

export interface SaleTunnelV2Props extends Pick<ModalProps, 'isOpen' | 'onClose'> {
  product: Product;

  course?: CourseLight;
  enrollment?: Enrollment;
  orderGroup?: OrderGroup;
  onFinish?: (order: Order) => void;

  // slots
  asideNode?: ReactNode;
  paymentNode?: ReactNode;
}

export const SaleTunnelV2 = (props: SaleTunnelV2Props) => {
  return (
    props.product.type === ProductType.CREDENTIAL && (
      <CredentialSaleTunnel {...props} product={props.product as CredentialProduct} />
    )
  );
};

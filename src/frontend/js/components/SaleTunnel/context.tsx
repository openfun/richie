import { createContext, useContext } from 'react';
import {
  CourseLight,
  Order,
  Enrollment,
  CertificateProduct,
  CredentialProduct,
  OrderGroup,
} from 'types/Joanie';

interface SaleTunnelContextBase {
  product: CredentialProduct | CertificateProduct;
  orderGroup?: OrderGroup;
  order?: Order;
  key: string;
  enrollment?: Enrollment;
  course?: CourseLight;
}

export interface SaleTunnelCredentialContext extends SaleTunnelContextBase {
  course: CourseLight;
  enrollment?: undefined;
  product: CredentialProduct | CertificateProduct;
}

export interface SaleTunnelCertificateContext extends SaleTunnelContextBase {
  enrollment: Enrollment;
  course?: undefined;
  product: CertificateProduct;
}

export type SaleTunnelContextType = SaleTunnelCredentialContext | SaleTunnelCertificateContext;

export const SaleTunnelContext = createContext<SaleTunnelContextType>({} as any);

export const useSaleTunnelContext = () => {
  const context = useContext(SaleTunnelContext);

  if (context === undefined) {
    throw new Error('useSaleTunnelContext must be used within a SaleTunnelContextProvider.');
  }

  return context;
};

import { createContext, useContext } from 'react';
import { CourseLight, CourseRun, Order, Product } from 'types/Joanie';

export interface SaleTunnelContextType {
  product: Product;
  order?: Order;
  courseRun?: CourseRun;
  setOrder: (order: Order) => void;
  key: string;
  course: CourseLight;
}
export const SaleTunnelContext = createContext<SaleTunnelContextType>({} as any);

export const useSaleTunnelContext = () => {
  const context = useContext(SaleTunnelContext);

  if (context === undefined) {
    throw new Error('useSaleTunnelContext must be used within a SaleTunnelContextProvider.');
  }

  return context;
};

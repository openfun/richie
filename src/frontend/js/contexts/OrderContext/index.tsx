import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';
import { Order } from '../../types/Joanie';
import { Maybe } from '../../types/utils';

export interface OrderContextInterface {
  order: Maybe<Order>;
  setOrder: (order: Maybe<Order>) => void;
}

export const OrderContext = createContext<Maybe<OrderContextInterface>>(undefined);

export interface OrderProviderProps {
  defaultOrder: Maybe<Order>;
}

export const OrderProvider = ({
  defaultOrder,
  children,
}: PropsWithChildren<OrderProviderProps>) => {
  const [order, setOrder] = useState(defaultOrder);
  const value = useMemo(
    () => ({
      order,
      setOrder,
    }),
    [order],
  );

  useEffect(() => {
    setOrder(order);
  }, [defaultOrder]);

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
};

export const useOrderContext = () => {
  const orderContext = useContext(OrderContext);

  if (orderContext) {
    return orderContext;
  }

  throw new Error(`orderContext must be used within a OrderContext`);
};

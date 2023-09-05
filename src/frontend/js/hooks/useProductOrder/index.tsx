import { useMemo } from 'react';
import { useOrders } from 'hooks/useOrders';
import { OrderState } from 'types/Joanie';

interface UseProductOrderProps {
  courseCode: string;
  productId: string;
}
const useProductOrder = ({ courseCode, productId }: UseProductOrderProps) => {
  const ordersQuery = useOrders({
    product: productId,
    course: courseCode,
    state: [OrderState.PENDING, OrderState.VALIDATED, OrderState.SUBMITTED],
  });

  const order = useMemo(() => {
    if (ordersQuery.items.length === 0) {
      return undefined;
    }
    return ordersQuery.items.reduce((last, newOrder) =>
      last.created_on > newOrder.created_on ? last : newOrder,
    );
  }, [ordersQuery.items]);

  return {
    ...ordersQuery,
    item: order,
  };
};

export default useProductOrder;

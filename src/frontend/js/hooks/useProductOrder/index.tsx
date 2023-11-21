import { useMemo } from 'react';
import { useOrders } from 'hooks/useOrders';
import { ACTIVE_ORDER_STATES } from 'types/Joanie';

interface UseProductOrderProps {
  courseCode: string;
  productId: string;
}
const useProductOrder = ({ courseCode, productId }: UseProductOrderProps) => {
  const ordersQuery = useOrders({
    product_id: productId,
    course_code: courseCode,
    state: ACTIVE_ORDER_STATES,
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

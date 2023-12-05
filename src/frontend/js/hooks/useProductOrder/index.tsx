import { useMemo } from 'react';
import { useOrders } from 'hooks/useOrders';
import { ACTIVE_ORDER_STATES } from 'types/Joanie';

interface UseProductOrderProps {
  courseCode?: string;
  enrollmentId?: string;
  productId: string;
}
const useProductOrder = ({ courseCode, enrollmentId, productId }: UseProductOrderProps) => {
  const ordersQuery = useOrders({
    course_code: courseCode,
    enrollment_id: enrollmentId,
    product_id: productId,
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

import { isJoanieEnabled } from 'api/joanie';
import { extractResourceMetadata } from 'api/lms/joanie';
import { useSession } from 'contexts/SessionContext';
import { useOrders } from 'hooks/useOrders';
import { CourseRun } from 'types';

const useCourseRunOrder = (courseRun: CourseRun) => {
  const { user } = useSession();
  const resourceLinkResources = extractResourceMetadata(courseRun.resource_link);
  const isProduct = !!(resourceLinkResources?.course && resourceLinkResources?.product);

  if (!isJoanieEnabled || !isProduct || !user) {
    return { item: undefined, undefined, states: { fetching: false, isFetched: true } };
  }

  const {
    items: orders,
    states: { fetching, isFetched },
  } = useOrders({
    course_code: resourceLinkResources?.course,
    product_id: resourceLinkResources?.product,
  });

  return { item: orders.length > 0 ? orders[0] : undefined, states: { fetching, isFetched } };
};

export default useCourseRunOrder;

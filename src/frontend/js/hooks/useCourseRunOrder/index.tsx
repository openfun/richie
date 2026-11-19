import { isJoanieEnabled } from 'api/joanie';
import { extractResourceMetadata } from 'api/lms/joanie';
import { useSession } from 'contexts/SessionContext';
import { useOrders } from 'hooks/useOrders';
import { CourseRun } from 'types';

const useCourseRunOrder = (courseRun: CourseRun) => {
  const { user } = useSession();
  const resourceLinkResources = extractResourceMetadata(courseRun.resource_link);
  const isProduct = !!(resourceLinkResources?.course && resourceLinkResources?.product);

  // `isJoanieEnabled` and `isProduct` never change during the life of the component, but
  // `user` does (e.g. once `/user/me` has answered): hooks must always be called for it.
  if (!isJoanieEnabled || !isProduct) {
    return { item: undefined, states: { fetching: false, isFetched: true } };
  }

  const {
    items: orders,
    states: { fetching, isFetched },
  } = useOrders({
    course_code: resourceLinkResources?.course,
    product_id: resourceLinkResources?.product,
  });

  // The query is disabled while there is no user: there is no order to wait for.
  if (!user) {
    return { item: undefined, states: { fetching: false, isFetched: true } };
  }

  return { item: orders?.[0], states: { fetching, isFetched } };
};

export default useCourseRunOrder;

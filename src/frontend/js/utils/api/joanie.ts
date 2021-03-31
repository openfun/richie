/**
 *
 * Joanie API Implementation
 *
 * This implementation is used for Joanie
 *
 */

import * as Joanie from 'types/Joanie';
import { handle } from 'utils/errors/handle';

// TODO Manage pagination &page&offset

function checkStatus(response: Response) {
  if (response.ok) return response.json();
  if (response.status === 401) return null;
  // TODO Explicit error message
  throw new Error('[JOANIE API] - Error during request');
}

const handleError = (fallback_value?: unknown) => (error: Error) => {
  handle(error);
  return fallback_value === undefined ? fallback_value : error;
};

const API = (APIConf: Joanie.Backend): Joanie.API => {
  const ROUTES = {
    orders: {
      create: APIConf.endpoint.concat('/api/orders/'),
      get: APIConf.endpoint.concat('/api/orders/:order_id'),
    },
    course: {
      products: {
        get: APIConf.endpoint.concat('/api/course/:course_id/products'),
      },
    },
  };

  return {
    orders: {
      create: async (product_id, resource_links) =>
        fetch(ROUTES.orders.create, {
          method: 'POST',
          body: JSON.stringify({ product_id, resource_links }),
        })
          .then(checkStatus)
          .catch(handleError()),
      get: async (orderId = '') =>
        fetch(ROUTES.orders.get.replace(':order_id', orderId))
          .then(checkStatus)
          .catch(handleError(null)),
    },
    course: {
      products: {
        get: async (courseId) =>
          fetch(ROUTES.course.products.get.replace(':course_id', courseId))
            .then(checkStatus)
            .catch(handleError([])),
      },
    },
  };
};

export default API;

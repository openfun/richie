/**
 *
 * Joanie API Interface
 *
 * Interface to interact with Joanie Api.
 *
 * ⚠︎ You should not import this API interface directly from a component,
 *    instead you should use the `useJoanieApi` Hook.
 *
 */
import queryString from 'query-string';
import type * as Joanie from 'types/Joanie';
import { AuthenticationApi } from 'api/authentication';
import context from 'utils/context';
import { HttpError } from 'utils/errors/HttpError';
import { JOANIE_API_VERSION } from 'settings';
import { ResourcesQuery } from 'hooks/useResources';
import { ObjectHelper } from 'utils/ObjectHelper';

interface CheckStatusOptions {
  fallbackValue: any;
  ignoredErrorStatus: number[];
}

export function getResponseBody(response: Response) {
  if (response.headers.get('Content-Type') === 'application/json') {
    return response.json();
  }
  if (response.headers.get('Content-Type') === 'application/pdf') {
    return response.blob();
  }
  return response.text();
}

/*
  A util to manage Joanie API responses.
  It parses properly the response according to its `Content-Type`
  otherwise it throws an `HttpError`.

  `options` arguments accept an array of ignoredErrorStatus. If the response
  fails with one of this status code, the `fallbackValue` will return and no error will
  be raised.
*/
export function checkStatus(
  response: Response,
  options: CheckStatusOptions = { fallbackValue: null, ignoredErrorStatus: [] },
): Promise<any> {
  if (response.ok) {
    return getResponseBody(response);
  }

  if (options.ignoredErrorStatus.includes(response.status)) {
    return Promise.resolve(options.fallbackValue);
  }

  throw new HttpError(response.status, response.statusText);
}

/*
  Generate default headers used for most of Joanie requests. It defined `Content-Type`
  to `application/json` and the `Accept-Language` to the active language.
*/
function getDefaultHeaders(): Record<string, string> {
  const $html = document.querySelector('html');
  const language = $html?.getAttribute('lang') || 'en-US';

  return {
    'Content-Type': 'application/json',
    'Accept-Language': language,
  };
}

/*
  Retrieve the access token from `AuthenticationApi` interface then bind it to
  the request through the `Authorization` header.
*/
function fetchWithJWT(routes: RequestInfo, options: RequestInit = {}) {
  const headers = (options.headers as Record<string, string>) || getDefaultHeaders();
  try {
    const accessToken = AuthenticationApi!.accessToken!();
    if (accessToken) {
      // eslint-disable-next-line @typescript-eslint/dot-notation
      headers['Authorization'] = `Bearer ${accessToken}`;
    }
  } catch (error) {
    throw new Error(
      `Joanie requires JWT Token to fetch data, but the configured authentication
      api does not contains a method \`accessToken\` to retrieve this information.`,
    );
  }

  options.headers = headers;
  return fetch(routes, options);
}

/**
 * Build Joanie API Routes interface.
 */
export const getAPIEndpoint = () => {
  const endpoint = context?.joanie_backend?.endpoint;
  const version = JOANIE_API_VERSION;

  if (!endpoint) {
    throw new Error('[JOANIE] - Joanie API endpoint is not defined.');
  }

  return `${endpoint}/api/${version}`;
};

export const getRoutes = () => {
  const baseUrl = getAPIEndpoint();

  return {
    user: {
      creditCards: {
        get: `${baseUrl}/credit-cards/:id/`,
        create: `${baseUrl}/credit-cards/`,
        update: `${baseUrl}/credit-cards/:id/`,
        delete: `${baseUrl}/credit-cards/:id/`,
      },
      addresses: {
        get: `${baseUrl}/addresses/:id/`,
        create: `${baseUrl}/addresses/`,
        update: `${baseUrl}/addresses/:id/`,
        delete: `${baseUrl}/addresses/:id/`,
      },
      orders: {
        abort: `${baseUrl}/orders/:id/abort/`,
        create: `${baseUrl}/orders/`,
        submit: `${baseUrl}/orders/:id/submit/`,
        get: `${baseUrl}/orders/:id/`,
        invoice: {
          download: `${baseUrl}/orders/:id/invoice/`,
        },
      },
      certificates: {
        download: `${baseUrl}/certificates/:id/download/`,
        get: `${baseUrl}/certificates/:id/`,
      },
      enrollments: {
        get: `${baseUrl}/enrollments/:id/`,
        create: `${baseUrl}/enrollments/`,
        update: `${baseUrl}/enrollments/:id/`,
      },
      wishlist: {
        get: `${baseUrl}/courses/:course_code/wish/`,
        create: `${baseUrl}/courses/:course_code/wish/`,
        delete: `${baseUrl}/courses/:course_code/wish/`,
      },
      organizations: {
        get: `${baseUrl}/organizations/:id/`,
        courseProductRelations: {
          get: `${baseUrl}/organizations/:id/course-product-relations/`,
        },
        courses: {
          get: `${baseUrl}/organizations/:id/courses/`,
        },
      },
      contracts: {
        get: `${baseUrl}/contracts/:id/`,
      },
    },
    courses: {
      get: `${baseUrl}/courses/:id/`,
      courseRuns: {
        get: `${baseUrl}/courses/:id/course-runs/`,
      },
      products: {
        get: `${baseUrl}/courses/:id/products/:product_id/`,
      },
    },
    courseRuns: {
      get: `${baseUrl}/course-runs/:id/`,
    },
    courseProductRelations: {
      get: `${baseUrl}/course-product-relations/:id/`,
    },
  };
};

/**
 * Flag which determines if joanie is enabled.
 */
export const isJoanieEnabled = !!context.joanie_backend;

export const buildApiUrl = <ApiFilters extends ResourcesQuery = ResourcesQuery>(
  url: string,
  filters?: ApiFilters,
) => {
  const { id = '', ...queryParameters } = filters || {};
  if (id) url = url.replace(':id', id);
  else url = url.replace(':id/', '');

  if (!ObjectHelper.isEmpty(queryParameters)) {
    url += '?' + queryString.stringify(queryParameters);
  }
  return url;
};

const API = (): Joanie.API => {
  const ROUTES = getRoutes();

  return {
    user: {
      creditCards: {
        get: async (filters?: ResourcesQuery) => {
          return fetchWithJWT(buildApiUrl(ROUTES.user.creditCards.get, filters)).then(checkStatus);
        },
        create: async (creditCard) =>
          fetchWithJWT(ROUTES.user.creditCards.create, {
            method: 'POST',
            body: JSON.stringify(creditCard),
          }).then(checkStatus),
        update: async ({ id, ...creditCard }) => {
          return fetchWithJWT(ROUTES.user.creditCards.update.replace(':id', id), {
            method: 'PUT',
            body: JSON.stringify(creditCard),
          }).then(checkStatus);
        },
        delete: async (id) =>
          fetchWithJWT(ROUTES.user.creditCards.delete.replace(':id', id), {
            method: 'DELETE',
          }).then(checkStatus),
      },
      addresses: {
        get: (id?: string) => {
          return fetchWithJWT(buildApiUrl(ROUTES.user.addresses.get, { id })).then(checkStatus);
        },
        create: async (payload) =>
          fetchWithJWT(ROUTES.user.addresses.create, {
            method: 'POST',
            body: JSON.stringify(payload),
          }).then(checkStatus),
        update: async ({ id, ...address }) =>
          fetchWithJWT(ROUTES.user.addresses.update.replace(':id', id), {
            method: 'PUT',
            body: JSON.stringify(address),
          }).then(checkStatus),
        delete: async (id) =>
          fetchWithJWT(ROUTES.user.addresses.delete.replace(':id', id), {
            method: 'DELETE',
          }).then(checkStatus),
      },
      orders: {
        abort: async ({ id, payment_id }) => {
          fetchWithJWT(ROUTES.user.orders.abort.replace(':id', id), {
            method: 'POST',
            body: payment_id ? JSON.stringify({ payment_id }) : undefined,
          }).then(checkStatus);
        },
        create: async (payload) =>
          fetchWithJWT(ROUTES.user.orders.create, {
            method: 'POST',
            body: JSON.stringify(payload),
          }).then(checkStatus),
        submit: async ({ id, ...payload }) =>
          fetchWithJWT(ROUTES.user.orders.submit.replace(':id', id), {
            method: 'PATCH',
            body: JSON.stringify(payload),
          }).then(checkStatus),
        get: async (filters) => {
          return fetchWithJWT(buildApiUrl(ROUTES.user.orders.get, filters)).then(checkStatus);
        },
        invoice: {
          download: async ({ order_id, invoice_reference }) => {
            let url = ROUTES.user.orders.invoice.download.replace(':id', order_id);
            url += `?${queryString.stringify({ reference: invoice_reference })}`;

            return fetchWithJWT(url).then(checkStatus);
          },
        },
      },
      enrollments: {
        create: async (payload) =>
          fetchWithJWT(ROUTES.user.enrollments.create, {
            method: 'POST',
            body: JSON.stringify(payload),
          }).then(checkStatus),
        get: async (filters) => {
          return fetchWithJWT(buildApiUrl(ROUTES.user.enrollments.get, filters)).then(checkStatus);
        },
        update: async ({ id, ...payload }) =>
          fetchWithJWT(ROUTES.user.enrollments.update.replace(':id', id), {
            method: 'PUT', // MARK or PATCH ?
            body: JSON.stringify(payload),
          }).then(checkStatus),
      },
      certificates: {
        download: async (id: string): Promise<File> =>
          fetchWithJWT(ROUTES.user.certificates.download.replace(':id', id)).then(checkStatus),
        get: async (filters) => {
          return fetchWithJWT(buildApiUrl(ROUTES.user.certificates.get, filters)).then(checkStatus);
        },
      },
      wish: {
        get: async (filters) => {
          const { id = '', ...parsedFilters } = filters || {};
          let url: string;
          if (id) url = ROUTES.user.wishlist.get.replace(':course_code', id);
          else url = ROUTES.user.wishlist.get.replace(':course_code/', '');
          return fetchWithJWT(buildApiUrl(url, parsedFilters), {
            method: 'GET',
          }).then(checkStatus);
        },
        create: async (id) => {
          return fetchWithJWT(ROUTES.user.wishlist.create.replace(':course_code', id), {
            method: 'POST',
          }).then(checkStatus);
        },
        delete: async (id) => {
          return fetchWithJWT(ROUTES.user.wishlist.delete.replace(':course_code', id), {
            method: 'DELETE',
          }).then(checkStatus);
        },
      },
      organizations: {
        get: async (filters) => {
          return fetchWithJWT(buildApiUrl(ROUTES.user.organizations.get, filters), {
            method: 'GET',
          }).then(checkStatus);
        },
      },
      contracts: {
        get: async (filters) => {
          let url;
          const { id = '', ...queryParameters } = filters || {};

          if (id) url = ROUTES.user.contracts.get.replace(':id', id);
          else url = ROUTES.user.contracts.get.replace(':id/', '');

          if (!ObjectHelper.isEmpty(queryParameters)) {
            url += '?' + queryString.stringify(queryParameters);
          }

          return fetchWithJWT(url, { method: 'GET' }).then(checkStatus);
        },
      },
    },
    courses: {
      get: (filters?: Joanie.CourseQueryFilters) => {
        const { organization_id: organizationId, ...parsedFilters } = filters || {};
        return fetchWithJWT(
          organizationId
            ? buildApiUrl(ROUTES.user.organizations.courses.get, {
                id: organizationId,
                ...parsedFilters,
              })
            : buildApiUrl(ROUTES.courses.get, parsedFilters),
        ).then(checkStatus);
      },
      products: {
        get: async (filters?: Joanie.CourseProductQueryFilters) => {
          if (!filters) {
            throw new Error(
              'A course code and a product id are required to fetch a course product',
            );
          } else if (!filters.id) {
            throw new Error('A course code is required to fetch a course product');
          } else if (!filters.productId) {
            throw new Error('A product id is required to fetch a course product');
          }

          const { id: courseId, productId, ...queryFilters } = filters;
          const url = ROUTES.courses.products.get
            .replace(':id', courseId)
            .replace(':product_id', productId);

          return fetchWithJWT(buildApiUrl(url, queryFilters)).then(checkStatus);
        },
      },
    },
    courseRuns: {
      get: (filters: Joanie.CourseRunFilters) => {
        const { course_id: courseId, ...parsedFilters } = filters || {};
        return fetchWithJWT(
          courseId
            ? buildApiUrl(ROUTES.courses.courseRuns.get, { id: courseId, ...parsedFilters })
            : buildApiUrl(ROUTES.courseRuns.get, parsedFilters),
        ).then(checkStatus);
      },
    },
    courseProductRelations: {
      get: (filters?: Joanie.CourseProductRelationQueryFilters) => {
        const { organization_id: organizationId, ...parsedFilters } = filters || {};
        return fetchWithJWT(
          organizationId
            ? buildApiUrl(ROUTES.user.organizations.courseProductRelations.get, {
                id: organizationId,
                ...parsedFilters,
              })
            : buildApiUrl(ROUTES.courseProductRelations.get, parsedFilters),
        ).then(checkStatus);
      },
    },
  };
};

export default API;

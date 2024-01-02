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
import { Maybe } from 'types/utils';

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
      me: {
        get: `${baseUrl}/users/me/`,
      },
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
        submit_for_signature: `${baseUrl}/orders/:id/submit_for_signature/`,
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
      wish: {
        get: `${baseUrl}/courses/:course_code/wish/`,
        create: `${baseUrl}/courses/:course_code/wish/`,
        delete: `${baseUrl}/courses/:course_code/wish/`,
      },
      contracts: {
        get: `${baseUrl}/contracts/:id/`,
        download: `${baseUrl}/contracts/:id/download/`,
      },
    },
    organizations: {
      get: `${baseUrl}/organizations/:id/`,
      courseProductRelations: {
        get: `${baseUrl}/organizations/:organization_id/course-product-relations/:id/`,
      },
      courses: {
        get: `${baseUrl}/organizations/:organization_id/courses/:id/`,
      },
      contracts: {
        get: `${baseUrl}/organizations/:organization_id/contracts/:id/`,
        getSignatureLinks: `${baseUrl}/organizations/:organization_id/contracts-signature-link/`,
      },
    },
    courses: {
      get: `${baseUrl}/courses/:id/`,
      courseRuns: {
        get: `${baseUrl}/courses/:course_id/course-runs/`,
      },
      products: {
        get: `${baseUrl}/courses/:course_id/products/:id/`,
      },
    },
    courseRuns: {
      get: `${baseUrl}/course-runs/:id/`,
    },
    courseProductRelations: {
      get: `${baseUrl}/course-product-relations/:id/`,
    },
    contractDefinitions: {
      previewTemplate: `${baseUrl}/contract_definitions/:id/preview_template/`,
    },
  };
};

/**
 * Flag which determines if joanie is enabled.
 */
export const isJoanieEnabled = !!context.joanie_backend;

const filterEmptyEntry = ([, value]: [PropertyKey, any]) => {
  if (value == null) return false; // Value is null/undefined
  if (value?.length !== undefined && value.length === 0) return false; // Value is an empty array/string
  return true;
};

interface ApiFilters extends Record<PropertyKey, any> {
  queryParameters?: Record<string, any>;
}

export const buildApiUrl = <Filters extends ApiFilters = ApiFilters>(
  raw_url: string,
  { queryParameters = {}, ...urlParams }: Maybe<Filters> = {} as Filters,
) => {
  // eslint-disable-next-line compat/compat
  const url = new URL(raw_url);

  if (!ObjectHelper.isEmpty(urlParams)) {
    Object.entries(urlParams)
      .filter(filterEmptyEntry)
      .forEach(([key, value]) => {
        if (url.pathname.search(`:${key}`) > 0) {
          url.pathname = url.pathname.replace(`:${key}`, value);
        } else {
          queryParameters[key] = value;
        }
      });
  }

  if (!ObjectHelper.isEmpty(queryParameters)) {
    Object.entries(queryParameters)
      .filter(filterEmptyEntry)
      .forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach((v) => url.searchParams.append(key, v));
        } else {
          url.searchParams.append(key, value);
        }
      });
  }

  // Clean up url pathname
  url.pathname = url.pathname.replaceAll(/:[a-z_]+\//g, '').replaceAll('//', '/');

  return url.toString();
};

const API = (): Joanie.API => {
  const ROUTES = getRoutes();

  return {
    user: {
      me: {
        get: async (filters?: ResourcesQuery) => {
          return fetchWithJWT(buildApiUrl(ROUTES.user.me.get, filters)).then(checkStatus);
        },
      },
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
        submit_for_signature: async (id) =>
          fetchWithJWT(ROUTES.user.orders.submit_for_signature.replace(':id', id), {
            method: 'POST',
          }).then(checkStatus),
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
          if (id) url = ROUTES.user.wish.get.replace(':course_code', id);
          else url = ROUTES.user.wish.get.replace(':course_code/', '');
          return fetchWithJWT(buildApiUrl(url, parsedFilters), {
            method: 'GET',
          }).then(checkStatus);
        },
        create: async (id) => {
          return fetchWithJWT(ROUTES.user.wish.create.replace(':course_code', id), {
            method: 'POST',
          }).then(checkStatus);
        },
        delete: async (id) => {
          return fetchWithJWT(ROUTES.user.wish.delete.replace(':course_code', id), {
            method: 'DELETE',
          }).then(checkStatus);
        },
      },
      contracts: {
        get: async ({ contract_ids, ...filters } = {}) => {
          const endpointFilters = { ...filters, queryParameters: { id: contract_ids } };
          return fetchWithJWT(
            filters?.organization_id
              ? buildApiUrl(ROUTES.organizations.contracts.get, endpointFilters)
              : buildApiUrl(ROUTES.user.contracts.get, filters),
            { method: 'GET' },
          ).then(checkStatus);
        },
        download(id: string): Promise<any> {
          return fetchWithJWT(ROUTES.user.contracts.download.replace(':id', id), {
            method: 'GET',
          }).then(checkStatus);
        },
      },
    },
    organizations: {
      get: async (filters) => {
        return fetchWithJWT(buildApiUrl(ROUTES.organizations.get, filters), {
          method: 'GET',
        }).then(checkStatus);
      },
      contracts: {
        getSignatureLinks: async (filters) => {
          return fetchWithJWT(
            buildApiUrl(ROUTES.organizations.contracts.getSignatureLinks, filters),
            {
              method: 'GET',
            },
          ).then(checkStatus);
        },
      },
    },
    courses: {
      get: (filters?: Joanie.CourseQueryFilters) => {
        return fetchWithJWT(
          filters?.organization_id
            ? buildApiUrl(ROUTES.organizations.courses.get, filters)
            : buildApiUrl(ROUTES.courses.get, filters),
        ).then(checkStatus);
      },
      products: {
        get: async (filters?: Joanie.CourseProductQueryFilters) => {
          if (!filters) {
            throw new Error(
              'A course code and a product id are required to fetch a course product',
            );
          } else if (!filters.course_id) {
            throw new Error('A course code is required to fetch a course product');
          } else if (!filters.id) {
            throw new Error('A product id is required to fetch a course product');
          }

          return fetchWithJWT(buildApiUrl(ROUTES.courses.products.get, filters)).then(checkStatus);
        },
      },
    },
    courseRuns: {
      get: (filters: Joanie.CourseRunFilters) => {
        return fetchWithJWT(
          filters.course_id
            ? buildApiUrl(ROUTES.courses.courseRuns.get, filters)
            : buildApiUrl(ROUTES.courseRuns.get, filters),
        ).then(checkStatus);
      },
    },
    courseProductRelations: {
      get: (filters?: Joanie.CourseProductRelationQueryFilters) => {
        return fetchWithJWT(
          filters?.organization_id
            ? buildApiUrl(ROUTES.organizations.courseProductRelations.get, filters)
            : buildApiUrl(ROUTES.courseProductRelations.get, filters),
        ).then(checkStatus);
      },
    },
    contractDefinitions: {
      previewTemplate(id: string): Promise<File> {
        return fetchWithJWT(
          buildApiUrl(ROUTES.contractDefinitions.previewTemplate, {
            id,
          }),
        ).then(checkStatus);
      },
    },
  };
};

export default API;

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
import { stringify } from 'query-string';
import type * as Joanie from 'types/Joanie';
import context from 'utils/context';
import { AuthenticationApi } from 'utils/api/authentication';
import { HttpError } from 'utils/errors/HttpError';

interface CheckStatusOptions {
  fallbackValue: any;
  ignoredErrorStatus: number[];
}
/*
  An util to manage Joanie API responses.
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
    if (response.headers.get('Content-Type') === 'application/json') {
      return response.json();
    }
    if (response.headers.get('Content-Type') === 'application/pdf') {
      return response.blob();
    }
    return response.text();
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
const getRoutes = (joanieEndpoint: string) => ({
  user: {
    creditCards: {
      get: `${joanieEndpoint}/api/credit-cards/:id/`,
      create: `${joanieEndpoint}/api/credit-cards/`,
      update: `${joanieEndpoint}/api/credit-cards/:id/`,
      delete: `${joanieEndpoint}/api/credit-cards/:id/`,
    },
    addresses: {
      get: `${joanieEndpoint}/api/addresses/:id/`,
      create: `${joanieEndpoint}/api/addresses/`,
      update: `${joanieEndpoint}/api/addresses/:id/`,
      delete: `${joanieEndpoint}/api/addresses/:id/`,
    },
    orders: {
      abort: `${joanieEndpoint}/api/orders/:id/abort/`,
      create: `${joanieEndpoint}/api/orders/`,
      get: `${joanieEndpoint}/api/orders/:id/`,
      invoice: {
        download: `${joanieEndpoint}/api/orders/:id/invoice/`,
      },
    },
    certificates: {
      download: `${joanieEndpoint}/api/certificates/:id/download/`,
    },
    enrollments: {
      get: `${joanieEndpoint}/api/enrollments/:id/`,
      create: `${joanieEndpoint}/api/enrollments/`,
      update: `${joanieEndpoint}/api/enrollments/:id/`,
    },
  },
  courses: {
    get: `${joanieEndpoint}/api/courses/:id/`,
  },
});

/**
 * Flag which determines if joanie is enabled.
 */
export const isJoanieEnabled = !!context.joanie_backend;

const API = (): Joanie.API => {
  const configuration = context.joanie_backend;

  if (!configuration) {
    throw new Error('[JOANIE] - Joanie is not configured.');
  }

  const ROUTES = getRoutes(configuration.endpoint);

  return {
    user: {
      creditCards: {
        get: async (id?: string) => {
          let url;

          if (id) url = ROUTES.user.creditCards.get.replace(':id', id);
          else url = ROUTES.user.creditCards.get.replace(':id/', '');

          return fetchWithJWT(url).then(checkStatus);
        },
        create: async (creditCard) =>
          fetchWithJWT(ROUTES.user.creditCards.create, {
            method: 'POST',
            body: JSON.stringify(creditCard),
          }).then(checkStatus),
        update: async ({ id, ...creditCard }) =>
          fetchWithJWT(ROUTES.user.creditCards.create.replace(':id', id), {
            method: 'PUT',
            body: JSON.stringify(creditCard),
          }).then(checkStatus),
        delete: async (id) =>
          fetchWithJWT(ROUTES.user.creditCards.create.replace(':id', id), {
            method: 'DELETE',
          }).then(checkStatus),
      },
      addresses: {
        get: (id?: string) => {
          let url;

          if (id) url = ROUTES.user.addresses.get.replace(':id', id);
          else url = ROUTES.user.addresses.get.replace(':id/', '');

          return fetchWithJWT(url).then(checkStatus);
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
        get: async (arg1) => {
          let url;
          let queryParameters;

          if (typeof arg1 === 'string') {
            url = ROUTES.user.orders.get.replace(':id', arg1);
          } else {
            url = ROUTES.user.orders.get.replace(':id/', '');
            queryParameters = stringify(arg1 || {});
          }

          if (queryParameters) {
            url += `?${queryParameters}`;
          }

          return fetchWithJWT(url).then(checkStatus);
        },
        invoice: {
          download: async ({ order_id, invoice_reference }) => {
            let url = ROUTES.user.orders.invoice.download.replace(':id', order_id);
            url += `?${stringify({ reference: invoice_reference })}`;

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
        get: async (arg1) => {
          let url;
          let queryParameters;

          if (typeof arg1 === 'string') {
            url = ROUTES.user.enrollments.get.replace(':id', arg1);
          } else {
            url = ROUTES.user.enrollments.get.replace(':id/', '');
            queryParameters = stringify(arg1 || {});
          }

          if (queryParameters) {
            url += `?${queryParameters}`;
          }

          return fetchWithJWT(url).then(checkStatus);
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
      },
    },
    courses: {
      get: async (id) =>
        fetchWithJWT(ROUTES.courses.get.replace(':id', id)).then((response) =>
          checkStatus(response, { fallbackValue: null, ignoredErrorStatus: [404] }),
        ),
    },
  };
};

export default API;

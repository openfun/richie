import { HttpError, HttpStatusCode } from 'utils/errors/HttpError';

interface CheckStatusOptions {
  fallbackValue: any;
  ignoredErrorStatus: (number | HttpStatusCode)[];
}

export async function getFileFromResponse(response: Response): Promise<File> {
  const filenameRegex = /filename="(.*)";/;
  const dispositionHeader = response.headers.get('Content-Disposition');
  const matches = dispositionHeader?.match(filenameRegex);

  return new File([await response.blob()], matches ? matches[1] : '', {
    type: response.headers.get('Content-Type') || '',
  });
}

export function getResponseBody(response: Response) {
  if (response.headers.get('Content-Type') === 'application/json') {
    return response.json();
  }
  const fileType = ['application/pdf', 'application/zip'];
  if (fileType.includes(response.headers.get('Content-Type') || '')) {
    return new Promise((resolve) => resolve(response));
  }
  return response.text();
}

/*
    A util to manage API responses.
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

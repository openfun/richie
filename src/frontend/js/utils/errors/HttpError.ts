/**
 * An error to raise when a request failed.
 * It has been designed to store response.status and response.statusText.
 */
export class HttpError extends Error {
  code: number;
  localizedMessage?: string;
  responseBody?: any;

  constructor(
    status: number,
    statusText: string,
    localizedMessage?: string,
    responseBody?: Promise<any>,
  ) {
    super(statusText);
    this.code = status;
    this.localizedMessage = localizedMessage;
    this.responseBody = responseBody;
  }
}
export function isHttpError(error: any): error is HttpError {
  return typeof error === 'object' && error instanceof HttpError;
}

export enum HttpStatusCode {
  OK = 200,
  NO_CONTENT = 204,
  UNAUTHORIZED = 401,
  BAD_REQUEST = 400,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  INTERNAL_SERVER_ERROR = 500,
}

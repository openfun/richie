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

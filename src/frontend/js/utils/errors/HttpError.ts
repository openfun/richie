/**
 * An error to raise when a request failed.
 * It has been designed to store response.status and response.statusText.
 */
export class HttpError extends Error {
  code: number;

  constructor(status: number, statusText: string) {
    super(statusText);
    this.code = status;
  }
}

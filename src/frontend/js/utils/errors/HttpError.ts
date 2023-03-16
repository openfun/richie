/**
 * An error to raise when a request failed.
 * It has been designed to store response.status and response.statusText.
 */
export class HttpError extends Error {
  code: number;
  localizedMessage?: string;

  constructor(status: number, statusText: string, localizedMessage?: string) {
    super(statusText);
    this.code = status;
    this.localizedMessage = localizedMessage;
  }
}

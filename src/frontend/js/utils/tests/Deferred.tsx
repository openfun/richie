/*
 * Test helper: use a deferred object to control promise resolution without mocking
 * deep inside our code.
 */
export class Deferred<T> {
  promise: Promise<T>;
  reject!: (reason?: any) => void;
  resolve!: (value?: T | PromiseLike<T> | undefined) => void;

  constructor() {
    this.promise = new Promise((resolve, reject) => {
      this.reject = reject;
      this.resolve = resolve;
    });
  }
}

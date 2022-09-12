export class StringHelper {
  static isString(input: any): boolean {
    return typeof input === 'string' || input instanceof String;
  }
}

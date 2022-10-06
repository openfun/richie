import { Maybe, Nullable } from 'types/utils';

export class StringHelper {
  static isString(input: any): boolean {
    return typeof input === 'string' || input instanceof String;
  }

  static capitalizeFirst(str?: Nullable<string>): Maybe<Nullable<string>> {
    if (!str) {
      return str;
    }
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

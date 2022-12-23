export class ObjectHelper {
  static isEmpty(obj: object): boolean {
    return !Object.entries(obj).length;
  }
}

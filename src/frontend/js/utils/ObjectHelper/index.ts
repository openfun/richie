export class ObjectHelper {
  static isEmpty(obj: object): boolean {
    return !Object.entries(obj).length;
  }

  static omit<Obj, Keys extends Array<keyof Obj>>(
    obj: Obj,
    ...keys: Keys
  ): Omit<Obj, (typeof keys)[number]> {
    const cleanedObject = { ...obj };
    keys.forEach((key) => delete cleanedObject[key]);
    return cleanedObject;
  }
}

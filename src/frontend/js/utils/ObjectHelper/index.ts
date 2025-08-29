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

  static removeEmptyFields<T>(obj: T): T | undefined {
    if (Array.isArray(obj)) {
      const arr = obj.map((v) => this.removeEmptyFields(v)).filter((v) => v !== undefined);
      return arr.length > 0 ? (arr as unknown as T) : undefined;
    } else if (obj && typeof obj === 'object') {
      const cleaned = Object.entries(obj)
        .map(([k, v]) => [k, this.removeEmptyFields(v)])
        .filter(([v]) => v !== undefined && v !== '' && v !== null && v !== 0);
      return cleaned.length > 0 ? (Object.fromEntries(cleaned) as T) : undefined;
    }
    return obj;
  }
}

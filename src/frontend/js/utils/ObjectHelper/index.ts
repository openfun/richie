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
    }
    if (obj && typeof obj === 'object') {
      const cleanedEntries = Object.entries(obj)
        .map(([k, v]) => [k, this.removeEmptyFields(v)])
        .filter(([, v]) => {
          if (v === undefined || v === null) return false;
          if (typeof v === 'string' && v.trim() === '') return false;
          if (Array.isArray(v) && v.length === 0) return false;
          if (typeof v === 'object' && Object.keys(v).length === 0) return false;
          return true;
        });
      return cleanedEntries.length > 0 ? (Object.fromEntries(cleanedEntries) as T) : undefined;
    }
    return obj;
  }
}

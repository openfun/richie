import mergeWith from 'lodash-es/mergeWith';
import isPlainObject from 'lodash-es/isPlainObject';

const UNDEFINED_PLACEHOLDER = '%%UNDEFINED%%';

type Subset<K> = {
  [attr in keyof K]?: K[attr] extends object
    ? Subset<K[attr]>
    : K[attr] extends object | null
      ? Subset<K[attr]> | null
      : K[attr] extends object | null | undefined
        ? Subset<K[attr]> | null | undefined
        : K[attr];
};

interface FactoryBuilderOptions {
  generateIndex?: number;
}
type FactoryBuilder<TData> = (options?: FactoryBuilderOptions) => TData;
interface FactoryInterface<TData> {
  one(): TData;
  many(number: number): TData[];
}

const setUndefinedValues = (obj: any) => {
  if (isPlainObject(obj)) {
    return Object.entries(obj).reduce((acc: any, [key, value]: [PropertyKey, any]) => {
      let parsedValue: any;
      if (isPlainObject(value)) {
        parsedValue = setUndefinedValues(value);
      } else {
        parsedValue = value;
      }
      return {
        ...acc,
        [key]: parsedValue === UNDEFINED_PLACEHOLDER ? undefined : parsedValue,
      };
    }, {});
  }
};

type Factory<TData> = (override?: Subset<TData>) => FactoryInterface<TData>;
export const factory = <TData>(builder: FactoryBuilder<TData>): Factory<TData> => {
  const mergeData = (data: TData, override: Subset<TData>): TData => {
    const customizer = (_objValue: any, srcValue: any) => {
      if (Array.isArray(srcValue)) {
        return srcValue;
      }
      // when we return undefined lodash.mergeWith use lodash.merge strategy
      if (srcValue === undefined) {
        return UNDEFINED_PLACEHOLDER;
      }
    };
    const mergedData = mergeWith(data, override, customizer);

    return setUndefinedValues(mergedData) as TData;
  };
  return (override: Subset<TData> = {}) => ({
    one: (): TData => mergeData(builder(), override),
    many: (amount: number): TData[] => {
      return Array.from(Array(amount), (_, i) =>
        mergeData(builder({ generateIndex: i }), override),
      );
    },
  });
};

export class FactoryConfig {
  static #isInternalConstructing = false;
  static #instance: FactoryConfig;
  static GLOBAL_UNIQUE_STORE = new Map<string, any>();

  constructor() {
    if (!FactoryConfig.#isInternalConstructing) {
      throw new TypeError('PrivateConstructor is not constructable');
    }
    FactoryConfig.#isInternalConstructing = false;
  }

  static getInstance(): FactoryConfig {
    if (!FactoryConfig.#instance) {
      FactoryConfig.#isInternalConstructing = true;
      FactoryConfig.#instance = new FactoryConfig();
    }

    return FactoryConfig.#instance;
  }

  static resetUniqueStore(): void {
    FactoryConfig.GLOBAL_UNIQUE_STORE.clear();
  }
}

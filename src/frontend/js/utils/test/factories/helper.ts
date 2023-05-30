import { FactoryConfig } from 'utils/test/factories/factories';

type GenericGenerator = (...args: any[]) => any;

export class FactoryHelper {
  static #DEFAULT_GLOBAL_STORE = FactoryConfig.GLOBAL_UNIQUE_STORE;
  static #COUNTER_STORE_KEY = 'counter';
  /**
   * Returns a function that will generate a unique value each time it is called.
   * Faker 9.0 has removed helpers.unique method. We need to implement our own.
   * @param generator
   * @param options
   */
  static unique<Generator extends GenericGenerator>(
    generator: Generator,
    options: {
      store?: Map<string, Set<any>>;
      maxRetries?: number;
      args?: Parameters<Generator>;
    } = {},
  ): ReturnType<Generator> {
    const args = options?.args ?? [];
    const maxRetries = options?.maxRetries || 50;
    const internalStore: Map<string, Set<any>> = options?.store ?? this.#DEFAULT_GLOBAL_STORE;
    const storeKey = generator.name + JSON.stringify(args);
    const entry = internalStore.get(storeKey) || new Set();
    let value;
    let retry = 0;

    do {
      value = generator(...args);
      retry++;
    } while (retry <= maxRetries && entry?.has(value));

    if (retry > maxRetries) {
      throw new Error(`Could not generate a unique value after ${maxRetries} retries.`);
    }

    internalStore.set(storeKey, entry.add(value));
    return value;
  }

  /**
   * If a field should be unique, and thus different for all built instances, use a sequence.
   * This generator is a function accepting a single parameter - the current sequence counter -
   * and returning the related value.
   * @param generator
   * @param options
   */
  static sequence<Generator extends GenericGenerator>(
    generator: (counter: number) => ReturnType<Generator>,
    options?: {
      store: Map<string, Set<number>>;
    },
  ): ReturnType<Generator> {
    const store: Map<string, number> = options?.store ?? this.#DEFAULT_GLOBAL_STORE;
    const counter = store.get(this.#COUNTER_STORE_KEY) ?? 0;

    const value = generator(counter);
    store.set(this.#COUNTER_STORE_KEY, counter + 1);

    return value;
  }
}

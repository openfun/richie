import { FactoryHelper } from 'utils/test/factories/helper';

describe('FactoryHelper', () => {
  describe('unique', () => {
    const incrementalNumberFactory = () => {
      let n = 0;
      return (incrementsBy = 1) => {
        n += incrementsBy;
        return n;
      };
    };

    it('should return an unique value', () => {
      const factory = incrementalNumberFactory();
      expect(FactoryHelper.unique(factory)).toEqual(1);
      expect(FactoryHelper.unique(factory)).toEqual(2);
    });

    it('should allow to pass parameters to original factory', () => {
      const factory = incrementalNumberFactory();
      expect(FactoryHelper.unique(factory, { args: [2] })).toEqual(2);
      expect(FactoryHelper.unique(factory, { args: [3] })).toEqual(5);
    });

    it('should allow to use a shared store', () => {
      const factory = incrementalNumberFactory();
      const store = new Map();
      store.set('[]', new Set([1, 2, 3]));
      expect(FactoryHelper.unique(factory, { store })).toEqual(4);
      expect(FactoryHelper.unique(factory, { store })).toEqual(5);
    });

    it('should throw an error if maxRetries is reached', () => {
      const factory = incrementalNumberFactory();
      const store = new Map();
      store.set('[]', new Set([1]));
      expect(() =>
        FactoryHelper.unique(factory, { maxRetries: 1, store }),
      ).toThrowErrorMatchingInlineSnapshot(`"Could not generate a unique value after 1 retries."`);
    });
  });

  describe('sequence', () => {
    it('should return an incremental value', () => {
      let value = FactoryHelper.sequence((counter) => `item ${counter}`);
      expect(value).toEqual('item 0');

      value = FactoryHelper.sequence((counter) => `item ${counter}`);
      expect(value).toEqual('item 1');
    });

    it('should allow to use a custom store', () => {
      const store = new Map();
      store.set('counter', 4);

      const generator = (counter: number) => `item ${counter}`;

      let value = FactoryHelper.sequence(generator, { store });
      expect(value).toEqual('item 4');

      value = FactoryHelper.sequence(generator, { store });
      expect(value).toEqual('item 5');

      // Use the default store to check that the custom store is not used anymore.
      value = FactoryHelper.sequence(generator);
      expect(value).toEqual('item 0');
    });
  });
});

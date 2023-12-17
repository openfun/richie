import { ObjectHelper } from 'utils/ObjectHelper/index';

describe('ObjectHelper', () => {
  describe('isEmpty', () => {
    it('should return true if object is empty', () => {
      expect(ObjectHelper.isEmpty({})).toBe(true);
    });

    it('should return false if object is not empty', () => {
      expect(ObjectHelper.isEmpty({ foo: 'bar' })).toBe(false);
    });

    it('should return true if array is empty', () => {
      expect(ObjectHelper.isEmpty([])).toBe(true);
    });

    it('should return true if array is not empty', () => {
      expect(ObjectHelper.isEmpty(['foo'])).toBe(false);
    });
  });

  describe('omit', () => {
    it('should return an object without the given keys', () => {
      expect(ObjectHelper.omit({ foo: 1, bar: 2, baz: 3 }, 'foo', 'baz')).toEqual({ bar: 2 });
    });
  });
});

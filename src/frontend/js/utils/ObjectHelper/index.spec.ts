import { ObjectHelper } from 'utils/ObjectHelper/index';

describe('ObjectHelper', () => {
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

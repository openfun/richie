import { StringHelper } from './index';

describe('StringHelper', () => {
  it('is a string', () => {
    expect(StringHelper.isString('Hello')).toBe(true);
  });

  it('is a ReactNode', () => {
    expect(StringHelper.isString(<div>Hello</div>)).toBe(false);
  });

  it('is null', () => {
    expect(StringHelper.isString(null)).toBe(false);
  });

  it('is a number', () => {
    expect(StringHelper.isString(10)).toBe(false);
  });

  it('is zero', () => {
    expect(StringHelper.isString(0)).toBe(false);
  });

  it('capitalizes first letter of a string', () => {
    expect(StringHelper.capitalizeFirst('a')).toBe('A');
    expect(StringHelper.capitalizeFirst('A')).toBe('A');
    expect(StringHelper.capitalizeFirst('hi there')).toBe('Hi there');
    expect(StringHelper.capitalizeFirst('1hi there')).toBe('1hi there');
    expect(StringHelper.capitalizeFirst('_hi there')).toBe('_hi there');
    expect(StringHelper.capitalizeFirst('')).toBe('');
    expect(StringHelper.capitalizeFirst(null)).toBe(null);
    expect(StringHelper.capitalizeFirst(undefined)).toBe(undefined);
  });

  it('abbreviates a string', () => {
    expect(StringHelper.abbreviate('John Doe')).toBe('JD');
    expect(StringHelper.abbreviate('John doe')).toBe('JD');
    expect(StringHelper.abbreviate('John Doe', 1)).toBe('J');
  });
});

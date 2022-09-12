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
});

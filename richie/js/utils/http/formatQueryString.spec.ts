import formatQueryString from './formatQueryString';

describe('utils/http - formatQueryString()', () => {
  it('returns an empty strings when it is called without params', () => {
    expect(formatQueryString()).toEqual('');
    expect(formatQueryString(null)).toEqual('');
  });

  it('returns a query string built from the params', () => {
    expect(formatQueryString({ foo: 'bar', fizz: 'buzz' })).toEqual(
      '?foo=bar&fizz=buzz',
    );
  });

  it('supports null as a param value', () => {
    expect(formatQueryString({ foo: 'bar', fizz: null })).toEqual(
      '?foo=bar&fizz=null',
    );
  });

  it('supports numbers as param values', () => {
    expect(formatQueryString({ foo: 12, bar: 98 })).toEqual('?foo=12&bar=98');
  });

  it('handles arrays as param values', () => {
    expect(formatQueryString({ foo: ['bar', 'baz'], fizz: 'buzz' })).toEqual(
      '?foo=bar&foo=baz&fizz=buzz',
    );
  });
});

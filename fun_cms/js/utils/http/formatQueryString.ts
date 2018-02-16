import toPairs from 'lodash-es/toPairs';

export default function formatQueryString(params: { [key: string]: string | string[] } = null) {
  if (params) {
    // Build the query string from the params passed to the xhr call
    return toPairs(params)
    .reduce((qs, [ key, value ], index, array) => {
      // Concatenate '&' unless we're handling the last parameter
      const lastCharIfNecessary = index === array.length - 1 ? '' : '&';
      // For strings simply concat them like { foo: 'bar' } => 'foo=bar'
      if (typeof value === 'string') {
        return qs + key + '=' + value + lastCharIfNecessary;
      } else {
        // For arrays use duplicate keys like { foo: [ 'bar', 'baz' ] } => 'foo=bar&foo=baz'
        return qs + value.map((v) => key + '=' + v).join('&') + lastCharIfNecessary;
      }
    }, '?');
  } else {
    return '';
  }
}

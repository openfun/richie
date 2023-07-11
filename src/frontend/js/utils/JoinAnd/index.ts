import { defineMessages, IntlShape } from 'react-intl';

const messages = defineMessages({
  and: {
    id: 'utils.joinAnd.and',
    description: 'The and word',
    defaultMessage: 'and',
  },
});

/**
 * Instead of using ['A', 'B', 'C'].join(', ') = "A, B, C"
 * This function gives
 * joinAnd(['A', 'B', 'C']) = "A, B and C"
 *
 * @param parts
 * @param intl
 * @param separator
 */
export const joinAnd = (parts: string[], intl: IntlShape, separator = ', ') => {
  if (parts.length === 0) {
    return '';
  }
  if (parts.length === 1) {
    return parts[0];
  }
  const subParts = parts.slice(0, parts.length - 1);
  const andPart = parts[parts.length - 1];
  return subParts.join(separator) + ' ' + intl.formatMessage(messages.and) + ' ' + andPart;
};

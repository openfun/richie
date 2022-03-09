import { type FormatDateOptions, useIntl } from 'react-intl';

/**
 * This hook must be used within <IntlProvider />.
 * It returns a method to format dates.
 *
 * By default, format options are:
 * - day: '2-digit'
 * - month: 'short'
 * - year: 'numeric'
 *
 * In english, output looks like "Mar 28, 2022".
 *
 * If you need to customize output, you are able to do that globally on hook instanciation
 * or for a specific date in formatDate call.
 *
 */
const useDateFormat = (formatOptions: FormatDateOptions = {}) => {
  const intl = useIntl();

  function formatDate(date: string, options: FormatDateOptions = {}) {
    return intl.formatDate(date, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      ...formatOptions,
      ...options,
    });
  }

  return formatDate;
};

export default useDateFormat;

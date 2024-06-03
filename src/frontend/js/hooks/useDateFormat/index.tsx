import { type FormatDateOptions, useIntl } from 'react-intl';
import { Maybe, Nullable } from 'types/utils';

export const DEFAULT_DATE_FORMAT: FormatDateOptions = {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
};
export const DATETIME_FORMAT: FormatDateOptions = {
  ...DEFAULT_DATE_FORMAT,
  hour: '2-digit',
  minute: '2-digit',
};

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

  function formatDate(
    date: Maybe<Nullable<string | Date | number>>,
    options: FormatDateOptions = {},
  ) {
    if (!date) {
      return undefined;
    }

    return intl.formatDate(date, {
      ...DEFAULT_DATE_FORMAT,
      ...formatOptions,
      ...options,
    });
  }

  return formatDate;
};

export default useDateFormat;

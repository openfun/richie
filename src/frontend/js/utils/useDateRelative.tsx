import { useIntl } from 'react-intl';
import { formatRelativeDate } from './relativeDate';

const useDateRelative = (targetDate: Date, fromDate: Date = new Date()): string => {
  const intl = useIntl();
  return formatRelativeDate(targetDate, fromDate, intl.locale);
};

export default useDateRelative;

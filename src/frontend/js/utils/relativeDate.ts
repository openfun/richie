import { Maybe } from '../types/utils';

interface DateDivision {
  // amount is the multiplier we use to go from the current division to the next
  amount: number;
  name: Intl.RelativeTimeFormatUnit;
}

const DIVISIONS: DateDivision[] = [
  { amount: 60, name: 'seconds' },
  { amount: 60, name: 'minutes' },
  { amount: 24, name: 'hours' },
  { amount: 7, name: 'days' },
  { amount: 4.34524, name: 'weeks' },
  { amount: 12, name: 'months' },
  { amount: Number.POSITIVE_INFINITY, name: 'years' },
];

export const formatRelativeDate = (
  targetDate: Date,
  fromDate: Date = new Date(),
  locale: Maybe<string> = undefined,
): string => {
  const formatter = new Intl.RelativeTimeFormat(locale, {
    numeric: 'always',
    style: 'long',
  });

  const fromDateTime = fromDate.getTime();
  const targetDateTime = targetDate.getTime();
  let duration = (targetDateTime - fromDateTime) / 1000;

  let result: Maybe<string>;
  DIVISIONS.forEach((division) => {
    if (Math.abs(duration) < division.amount && result === undefined) {
      result = formatter.format(Math.round(duration), division.name);
    }
    duration /= division.amount;
  });

  return result ?? '';
};

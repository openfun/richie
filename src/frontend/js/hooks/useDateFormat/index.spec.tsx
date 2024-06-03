import { renderHook } from '@testing-library/react';
import { IntlWrapper } from 'utils/test/wrappers/IntlWrapper';
import useDateFormat from '.';

describe('useDateFormat', () => {
  it('should format date with default options', () => {
    const date = new Date('2022-03-28T00:00:00.000Z');
    const { result: dateFormatter } = renderHook(useDateFormat, { wrapper: IntlWrapper });

    expect(dateFormatter.current(date)).toBe('Mar 28, 2022');
  });

  it('should format date with custom options', () => {
    const date = new Date('2022-03-28T00:00:00.000Z');
    const { result: dateFormatter } = renderHook(
      () =>
        useDateFormat({
          month: 'long',
        }),
      { wrapper: IntlWrapper },
    );

    expect(dateFormatter.current(date)).toBe('March 28, 2022');
  });

  it('date is undefined it should return undefined', () => {
    const { result: dateFormatter } = renderHook(
      () =>
        useDateFormat({
          month: 'long',
        }),
      { wrapper: IntlWrapper },
    );

    expect(dateFormatter.current(undefined)).toBe(undefined);
  });

  it('date is null it should return undefined', () => {
    const { result: dateFormatter } = renderHook(
      () =>
        useDateFormat({
          month: 'long',
        }),
      { wrapper: IntlWrapper },
    );

    expect(dateFormatter.current(null)).toBe(undefined);
  });
});

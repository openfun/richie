import { faker } from '@faker-js/faker';
import { CreditCardExpirationStatus, CreditCardHelper } from 'utils/CreditCardHelper/index';
import { CreditCardFactory } from 'utils/test/factories/joanie';

describe('CreditCardHelper', () => {
  it('handles falsy values', () => {
    expect(
      CreditCardHelper.isExpiredSoon(
        CreditCardFactory({ expiration_month: undefined, expiration_year: undefined }).one(),
      ),
    ).toBe(false);
  });

  it('is not soon expired', () => {
    const refDate = new Date();
    refDate.setMonth(refDate.getMonth() + 4);
    const date = faker.date.future({ refDate });

    expect(
      CreditCardHelper.getExpirationState({
        ...CreditCardFactory().one(),
        expiration_month: date.getMonth() + 1,
        expiration_year: date.getFullYear(),
      }),
    ).toBe(CreditCardExpirationStatus.FINE);
  });

  it('is soon expired', () => {
    const refDate = new Date();
    refDate.setMonth(refDate.getMonth() + 1);
    refDate.setDate(1);
    const futureLessThan3Months = faker.date.future({
      years: 2.99 / 12,
      refDate,
    });

    expect(
      CreditCardHelper.getExpirationState({
        ...CreditCardFactory().one(),
        expiration_month: futureLessThan3Months.getMonth() + 1,
        expiration_year: futureLessThan3Months.getFullYear(),
      }),
    ).toBe(CreditCardExpirationStatus.SOON);
  });

  it('is expired', () => {
    const date = faker.date.past();
    expect(
      CreditCardHelper.getExpirationState({
        ...CreditCardFactory().one(),
        expiration_month: date.getMonth() + 1,
        expiration_year: date.getFullYear(),
      }),
    ).toBe(CreditCardExpirationStatus.EXPIRED);
  });
});

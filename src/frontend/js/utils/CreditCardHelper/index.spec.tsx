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
      CreditCardHelper.getExpirationState(
        CreditCardFactory({
          expiration_month: date.getMonth() + 1,
          expiration_year: date.getFullYear(),
        }).one(),
      ),
    ).toBe(CreditCardExpirationStatus.FINE);
  });

  it('is soon expired', () => {
    const now = new Date();
    const expirationDate = faker.date.between({
      from: now,
      to: new Date(now.getFullYear(), now.getMonth() + 4, 0, 23, 59, 59),
    });

    expect(
      CreditCardHelper.getExpirationState(
        CreditCardFactory({
          expiration_month: expirationDate.getMonth() + 1,
          expiration_year: expirationDate.getFullYear(),
        }).one(),
      ),
    ).toBe(CreditCardExpirationStatus.SOON);
  });

  it('is expired', () => {
    const now = new Date();
    const date = faker.date.past({
      refDate: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59),
    });
    expect(
      CreditCardHelper.getExpirationState(
        CreditCardFactory({
          expiration_month: date.getMonth() + 1,
          expiration_year: date.getFullYear(),
        }).one(),
      ),
    ).toBe(CreditCardExpirationStatus.EXPIRED);
  });
});

import { CreditCard } from 'types/Joanie';

export enum CreditCardExpirationStatus {
  EXPIRED = 'expired',
  SOON = 'soon',
  FINE = 'fine',
}

export class CreditCardHelper {
  /**
   * Tells if the credit card will expire soon.
   * Soon is considered below 3 months.
   */
  static isExpiredSoon(creditCard: CreditCard): boolean {
    if (!creditCard.expiration_month || !creditCard.expiration_year) {
      return false;
    }
    const expirationDate = new Date(
      creditCard.expiration_year,
      creditCard.expiration_month,
      0,
      23,
      59,
      59,
    );
    const limitDate = new Date(new Date().getFullYear(), new Date().getMonth() + 4, 0, 23, 59, 59);
    return limitDate.getTime() >= expirationDate.getTime();
  }

  static isExpired(creditCard: CreditCard): boolean {
    const expirationDate = new Date(
      creditCard.expiration_year,
      creditCard.expiration_month,
      0,
      23,
      59,
      59,
    );
    const now = new Date();
    return expirationDate.getTime() <= now.getTime();
  }

  static getExpirationState(creditCard: CreditCard): CreditCardExpirationStatus {
    if (CreditCardHelper.isExpired(creditCard)) {
      return CreditCardExpirationStatus.EXPIRED;
    }
    if (CreditCardHelper.isExpiredSoon(creditCard)) {
      return CreditCardExpirationStatus.SOON;
    }
    return CreditCardExpirationStatus.FINE;
  }
}

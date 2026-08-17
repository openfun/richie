import { OrderState } from 'types/Joanie';
import { CredentialOrderFactory, OrderEnrollmentFactory } from 'utils/test/factories/joanie';
import { OrderHelper, OrderStatus } from '.';

describe('OrderHelper', () => {
  describe('isWithdrawn', () => {
    it('should return false when the order is undefined', () => {
      expect(OrderHelper.isWithdrawn(undefined)).toBe(false);
    });

    it('should return false when withdrawn_confirmation_at is not set', () => {
      const order = CredentialOrderFactory({ withdrawn_confirmation_at: null }).one();
      expect(OrderHelper.isWithdrawn(order)).toBe(false);
    });

    it('should return true when withdrawn_confirmation_at is set', () => {
      const order = CredentialOrderFactory({
        withdrawn_confirmation_at: new Date().toISOString(),
      }).one();
      expect(OrderHelper.isWithdrawn(order)).toBe(true);
    });
  });

  describe('getState', () => {
    it('should return WITHDRAWN when the order has been withdrawn, regardless of its state', () => {
      const order = CredentialOrderFactory({
        state: OrderState.CANCELED,
        withdrawn_confirmation_at: new Date().toISOString(),
      }).one();
      expect(OrderHelper.getState(order)).toBe(OrderStatus.WITHDRAWN);
    });

    it('should return PENDING_WITHDRAWAL for a pending_withdraw order', () => {
      const order = CredentialOrderFactory({
        state: OrderState.PENDING_WITHDRAW,
        withdrawn_confirmation_at: null,
      }).one();
      expect(OrderHelper.getState(order)).toBe(OrderStatus.PENDING_WITHDRAWAL);
    });
  });

  describe('getActiveEnrollmentOrder', () => {
    it('should return a withdrawn order matching the product id even though it is not active', () => {
      const withdrawnOrder = OrderEnrollmentFactory({
        state: OrderState.CANCELED,
        product_id: 'PRODUCT_ID',
        withdrawn_confirmation_at: new Date().toISOString(),
      }).one();

      expect(OrderHelper.getActiveEnrollmentOrder([withdrawnOrder], 'PRODUCT_ID')).toBe(
        withdrawnOrder,
      );
    });

    it('should not return a canceled order that has not been withdrawn', () => {
      const canceledOrder = OrderEnrollmentFactory({
        state: OrderState.CANCELED,
        product_id: 'PRODUCT_ID',
        withdrawn_confirmation_at: null,
      }).one();

      expect(OrderHelper.getActiveEnrollmentOrder([canceledOrder], 'PRODUCT_ID')).toBeUndefined();
    });
  });

  describe('isPurchasable', () => {
    it('should return true when the order has been withdrawn, regardless of its state', () => {
      const order = CredentialOrderFactory({
        state: OrderState.CANCELED,
        withdrawn_confirmation_at: new Date().toISOString(),
      }).one();
      expect(OrderHelper.isPurchasable(order)).toBe(true);
    });
  });
});

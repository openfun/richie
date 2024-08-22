/**
 * Test suite for the helper `PaymentScheduleHelper`.
 */
import PaymentScheduleHelper from 'utils/PaymentScheduleHelper/index';
import { PaymentInstallmentFactory } from 'utils/test/factories/joanie';
import { PaymentScheduleState } from 'types/Joanie';

describe('PaymentScheduleHelper', () => {
  describe('getFailedInstallment', () => {
    it('should return undefined if payment_schedule is undefined', () => {
      const foundInstallment = PaymentScheduleHelper.getFailedInstallment(undefined);

      expect(foundInstallment).toBeUndefined();
    });

    it('should return undefined if payment schedule does not have a failed installment', () => {
      const schedule = PaymentInstallmentFactory({ state: PaymentScheduleState.PENDING }).many(3);
      const foundInstallment = PaymentScheduleHelper.getFailedInstallment(schedule);

      expect(foundInstallment).toBeUndefined();
    });

    it('should return the older failed installment', () => {
      const schedule = [
        PaymentInstallmentFactory({
          state: PaymentScheduleState.PAID,
          due_date: '2024-06-21',
        }).one(),
        PaymentInstallmentFactory({
          state: PaymentScheduleState.REFUSED,
          due_date: '2024-08-20',
        }).one(),
        PaymentInstallmentFactory({
          state: PaymentScheduleState.REFUSED,
          due_date: '2024-07-20',
        }).one(),
      ];
      const foundInstallment = PaymentScheduleHelper.getFailedInstallment(schedule);

      expect(foundInstallment?.due_date).toBe(schedule[2].due_date);
    });
  });

  describe('getPendingInstallment', () => {
    it('should return undefined if payment_schedule is undefined', () => {
      const foundInstallment = PaymentScheduleHelper.getPendingInstallment(undefined);

      expect(foundInstallment).toBeUndefined();
    });

    it('should return undefined if payment schedule does not have a pending installment', () => {
      const schedule = PaymentInstallmentFactory({ state: PaymentScheduleState.PAID }).many(3);
      const foundInstallment = PaymentScheduleHelper.getPendingInstallment(schedule);

      expect(foundInstallment).toBeUndefined();
    });

    it('should return the older pending installment', () => {
      const schedule = [
        PaymentInstallmentFactory({
          state: PaymentScheduleState.PAID,
          due_date: '2024-06-21',
        }).one(),
        PaymentInstallmentFactory({
          state: PaymentScheduleState.PENDING,
          due_date: '2024-08-20',
        }).one(),
        PaymentInstallmentFactory({
          state: PaymentScheduleState.PENDING,
          due_date: '2024-07-20',
        }).one(),
      ];

      const foundInstallment = PaymentScheduleHelper.getPendingInstallment(schedule);
      expect(foundInstallment?.due_date).toBe(schedule[2].due_date);
    });
  });
});

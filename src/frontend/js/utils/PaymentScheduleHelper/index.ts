import { PaymentInstallment, PaymentSchedule, PaymentScheduleState } from 'types/Joanie';
import { Maybe } from 'types/utils';

export default class PaymentScheduleHelper {
  static #sortByDueDateAsc(a: PaymentInstallment, b: PaymentInstallment) {
    const dateA = new Date(a.due_date).getTime();
    const dateB = new Date(b.due_date).getTime();
    return dateA - dateB;
  }

  static #getInstallmentByState(
    payment_schedule: Maybe<PaymentSchedule>,
    state: PaymentScheduleState,
  ) {
    if (!payment_schedule) return undefined;

    const installments = [...payment_schedule];
    return installments
      ?.sort(this.#sortByDueDateAsc)
      .find((installment) => installment.state === state);
  }

  static getFailedInstallment(payment_schedule: Maybe<PaymentSchedule>) {
    return this.#getInstallmentByState(payment_schedule, PaymentScheduleState.REFUSED);
  }

  static getPendingInstallment(payment_schedule: Maybe<PaymentSchedule>) {
    return this.#getInstallmentByState(payment_schedule, PaymentScheduleState.PENDING);
  }
}

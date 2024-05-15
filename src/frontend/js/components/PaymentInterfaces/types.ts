import { Payment } from 'types/Joanie';

export enum PaymentErrorMessageId {
  ERROR_ABORT = 'errorAbort',
  ERROR_ABORTING = 'errorAborting',
  ERROR_ADDRESS = 'errorAddress',
  ERROR_DEFAULT = 'errorDefault',
  ERROR_FULL_PRODUCT = 'errorFullProduct',
  ERROR_TERMS = 'errorTerms',
}

export interface PaymentInterfaceProps extends Payment {
  onSuccess: () => void;
  onError: (messageId: PaymentErrorMessageId) => void;
}

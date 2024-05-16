export enum PaymentErrorMessageId {
  ERROR_ABORT = 'errorAbort',
  ERROR_ABORTING = 'errorAborting',
  ERROR_ADDRESS = 'errorAddress',
  ERROR_DEFAULT = 'errorDefault',
  ERROR_FULL_PRODUCT = 'errorFullProduct',
  ERROR_TERMS = 'errorTerms',
}

export enum PaymentProviders {
  DUMMY = 'dummy',
  PAYPLUG = 'payplug',
  LYRA = 'lyra',
}

export interface PaymentWithId {
  payment_id: string;
}

export interface DummyPayment extends PaymentWithId {
  provider_name: PaymentProviders.DUMMY;
  url: string;
  is_paid?: boolean;
}

export interface PayplugPayment extends PaymentWithId {
  provider_name: PaymentProviders.PAYPLUG;
  url: string;
  is_paid?: boolean;
}

export interface LyraPayment {
  provider_name: PaymentProviders.LYRA;
  form_token: string;
  configuration: {
    public_key: string;
    base_url: string;
  };
}

export type Payment = DummyPayment | PayplugPayment | LyraPayment;

export type PaymentInterfaceProps<P extends Payment = Payment> = P & {
  onSuccess: () => void;
  onError: (messageId: PaymentErrorMessageId) => void;
};

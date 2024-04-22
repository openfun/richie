import { lazy, Suspense, useEffect } from 'react';
import * as Joanie from 'types/Joanie';
import { handle } from 'utils/errors/handle';

export enum PaymentErrorMessageId {
  ERROR_ABORT = 'errorAbort',
  ERROR_ABORTING = 'errorAborting',
  ERROR_ADDRESS = 'errorAddress',
  ERROR_DEFAULT = 'errorDefault',
  ERROR_FULL_PRODUCT = 'errorFullProduct',
  ERROR_TERMS = 'errorTerms',
}

const LazyPayplugLightbox = lazy(() => import('./PayplugLightbox'));
const LazyDummy = lazy(() => import('./Dummy'));

export interface PaymentInterfaceProps extends Joanie.Payment {
  onSuccess: () => void;
  onError: (messageId: PaymentErrorMessageId) => void;
}

/**
 * In charge of rendering the right payment interface according to the
 * `provider` property. Return null if the provider is not supported.
 */
const PaymentInterface = (props: PaymentInterfaceProps) => {
  const isNotImplementedProvider = !Object.values<string>(Joanie.PaymentProviders).includes(
    props.provider_name,
  );

  useEffect(() => {
    if (isNotImplementedProvider) {
      props.onError(PaymentErrorMessageId.ERROR_DEFAULT);
      const error = new Error(`Payment provider ${props.provider_name} not implemented`);
      handle(error);
    }
  }, [props]);

  if (isNotImplementedProvider) return null;

  return (
    <Suspense fallback={null}>
      {props.provider_name === Joanie.PaymentProviders.PAYPLUG && (
        <LazyPayplugLightbox {...props} />
      )}
      {props.provider_name === Joanie.PaymentProviders.DUMMY && <LazyDummy {...props} />}
    </Suspense>
  );
};

export default PaymentInterface;

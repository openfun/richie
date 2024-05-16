import { lazy, Suspense, useEffect } from 'react';
import { handle } from 'utils/errors/handle';
import {
  PaymentErrorMessageId,
  PaymentProviders,
  PaymentInterfaceProps,
} from 'components/PaymentInterfaces/types';

const LazyPayplugLightbox = lazy(() => import('./PayplugLightbox'));
const LazyDummy = lazy(() => import('./Dummy'));
const LazyLyraPopIn = lazy(() => import('./LyraPopIn'));

/**
 * In charge of rendering the right payment interface according to the
 * `provider` property. Return null if the provider is not supported.
 */
const PaymentInterface = (props: PaymentInterfaceProps) => {
  const isNotImplementedProvider = !Object.values<string>(PaymentProviders).includes(
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
      {props.provider_name === PaymentProviders.PAYPLUG && <LazyPayplugLightbox {...props} />}
      {props.provider_name === PaymentProviders.DUMMY && <LazyDummy {...props} />}
      {props.provider_name === PaymentProviders.LYRA && <LazyLyraPopIn {...props} />}
    </Suspense>
  );
};

export default PaymentInterface;

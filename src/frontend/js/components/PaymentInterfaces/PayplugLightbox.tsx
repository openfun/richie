import { useCallback, useEffect, useRef } from 'react';
import { handle } from 'utils/errors/handle';
import {
  PaymentErrorMessageId,
  PayplugPayment,
  PaymentInterfaceProps,
} from 'components/PaymentInterfaces/types';

/**
 * Load the form payplug script if it has been not yet uploaded then open
 * the lightbox and listen messages coming from it.
 *
 * https://docs.payplug.com/api/lightbox.html#lightbox
 */
const PayplugLightbox = ({
  onSuccess,
  onError,
  ...props
}: PaymentInterfaceProps<PayplugPayment>) => {
  const ref = useRef<ReturnType<typeof setTimeout>>();

  /** type guard to check if the payment is a payment one click */
  const isPaidPayment = (p: PayplugPayment) => p?.is_paid === true;

  const listenPayplugIframeMessage = (event: MessageEvent) => {
    if (typeof event.data === 'string') {
      switch (event.data) {
        case 'closePayPlugFrame':
          ref.current = setTimeout(() => {
            onError(PaymentErrorMessageId.ERROR_ABORTING);
          }, 2000);
          break;
      }
    } else if (typeof event.data === 'object') {
      switch (event.data.event) {
        case 'paidByPayPlug':
          /**
           * We have to do this because for One Click Payments, PayPlug no longer returns is_paid
           * to true when the payment was successful. This opens a confirmation modal.
           * When we want to close it, the two events are trigger and are concurrency.
           */
          if (ref.current) {
            clearTimeout(ref.current);
          } else {
            window.Payplug._closeIframe();
          }
          onSuccess();
      }
    } else {
      handle(`[PayplugLightbox] - Unknown message type posted.`);
    }
  };

  const openLightbox = useCallback(() => {
    window.Payplug.showPayment(props.url);
    window.addEventListener('message', listenPayplugIframeMessage);
  }, [props.url]);

  useEffect(() => {
    if (isPaidPayment(props)) {
      onSuccess();
      return;
    }

    if (!window.Payplug) {
      const script = document.createElement('script');
      script.src = 'https://api.payplug.com/js/1/form.latest.js';
      script.async = true;
      document.body.appendChild(script);
      script.onload = openLightbox;
      script.onerror = () => onError(PaymentErrorMessageId.ERROR_DEFAULT);
    } else {
      openLightbox();
    }

    return () => {
      window.removeEventListener('message', listenPayplugIframeMessage);
    };
  }, []);

  return null;
};

export default PayplugLightbox;

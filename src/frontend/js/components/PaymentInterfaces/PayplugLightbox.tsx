import { useCallback, useEffect } from 'react';
import { PaymentErrorMessageId } from 'components/PaymentButton';
import { handle } from 'utils/errors/handle';
import type { PaymentInterfaceProps } from '.';

/**
 * Load the form payplug script if it has been not yet uploaded then open
 * the lightbox and listen messages coming from it.
 *
 * https://docs.payplug.com/api/lightbox.html#lightbox
 */
const PayplugLightbox = ({ url, onSuccess, onError }: PaymentInterfaceProps) => {
  const listenPayplugIframeMessage = (event: MessageEvent) => {
    if (typeof event.data === 'string') {
      switch (event.data) {
        case 'closePayPlugFrame':
          onError(PaymentErrorMessageId.ERROR_ABORTING);
          break;
      }
    } else if (typeof event.data === 'object') {
      switch (event.data.event) {
        case 'paidByPayPlug':
          window.Payplug._closeIframe();
          onSuccess();
      }
    } else {
      handle(`[PayplugLightbox] - Unknown message type posted.`);
    }
  };

  const openLightbox = useCallback(() => {
    window.Payplug.showPayment(url);
    window.addEventListener('message', listenPayplugIframeMessage);
  }, [url]);

  useEffect(() => {
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

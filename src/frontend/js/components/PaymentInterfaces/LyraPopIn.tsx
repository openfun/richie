import KRGlue from '@lyracom/embedded-form-glue';
import { useIntl } from 'react-intl';
import { useRef, useEffect } from 'react';
import {
  PaymentErrorMessageId,
  PaymentInterfaceProps,
  LyraPayment,
} from 'components/PaymentInterfaces/types';
import { useAsyncEffect } from 'hooks/useAsyncEffect';
import { handle } from 'utils/errors/handle';

enum KROrderStatus {
  PAID = 'PAID',
  UNPAID = 'UNPAID',
}

const LYRA_FORM_ID = 'lyra-form';

const LyraPopIn = ({
  onSuccess,
  onError,
  configuration,
  form_token: formToken,
}: PaymentInterfaceProps<LyraPayment>) => {
  const intl = useIntl();
  const shouldAbort = useRef<Boolean>(true);

  const handleError = (error?: Error | string) => {
    if (error && typeof error === 'string') handle(`[LyraPopIn] - ${error}`);

    if (shouldAbort.current) {
      onError(PaymentErrorMessageId.ERROR_ABORT);
    } else if (typeof error === 'string') {
      onError(error);
    } else {
      onError(PaymentErrorMessageId.ERROR_DEFAULT);
    }
  };

  const initializeLyraForm = async () => {
    const { base_url: baseUrl, public_key: publicKey } = configuration;

    const link = document.createElement('link');
    link.setAttribute('rel', 'stylesheet');
    link.setAttribute('href', `${baseUrl}/static/js/krypton-client/V4.0/ext/neon-reset.min.css`);
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = `${baseUrl}/static/js/krypton-client/V4.0/ext/neon.js`;
    document.head.appendChild(script);

    const { KR } = await KRGlue.loadLibrary(baseUrl, publicKey).catch((error) => {
      handleError(error);
      return { KR: null };
    });

    return KR;
  };

  useAsyncEffect(async () => {
    const KR = window.KR ?? (await initializeLyraForm());
    if (KR === null) return;

    await KR.setFormConfig({
      formToken,
      'kr-language': intl.locale,
      'kr-spa-mode': true,
      'kr-z-index': '400',
    });

    // Create a container for the lyra form which must be out of the React tree.
    // This is necessary to avoid the form being unmounted when the component is.
    const formContainer = document.createElement('div');
    formContainer.id = LYRA_FORM_ID;
    formContainer.classList.add('kr-embedded');
    formContainer.setAttribute('kr-popin', '');
    formContainer.style.visibility = 'hidden';
    document.body.appendChild(formContainer);

    const {
      result: { formId },
    } = await KR.renderElements('#' + LYRA_FORM_ID);

    const handleFormSubmit = async (response: KRPaymentResponse) => {
      shouldAbort.current = false;
      await KR.closePopin(formId);
      if (response.clientAnswer.orderStatus === KROrderStatus.PAID) {
        onSuccess();
        return true;
      }

      handleError();
      return false;
    };

    const handleFormError = async (error: KRError) => {
      // Do not close the pop-in if the error is a invalid data error (CLIENT_3XX).
      // https://docs.lyra.com/fr/rest/V4.0/javascript/features/js_error_management.html#client004
      const { errorCode, errorMessage, detailedErrorMessage } = error;
      // Since the latest version of Lyra SDK released on 20/08/2024,
      // error codes CLIENT_101, CLIENT_106 are raised when the user closes the pop-in so with our
      // current implementation it triggers an infinite loop...
      // A patch from Lyra is planned, until that we have to ignore this error.
      if (!errorCode.startsWith('CLIENT_3') && !['CLIENT_101', 'CLIENT_106'].includes(errorCode)) {
        shouldAbort.current = false;
        await KR.closePopin(formId);
        let errorMessages = errorMessage;
        if (detailedErrorMessage) {
          errorMessages += `: ${detailedErrorMessage}`;
        }
        handleError(errorMessages);
      }
    };

    const handleClosePopIn = () => {
      if (shouldAbort.current === true) {
        onError(PaymentErrorMessageId.ERROR_ABORT);
      }
    };

    const openPopIn = async () => {
      KR.openPopin(formId);
    };

    KR.onSubmit(handleFormSubmit);
    KR.onError(handleFormError);
    KR.onPopinClosed(handleClosePopIn);
    KR.onFormReady(openPopIn);

    return async () => {
      /* On unmount, remove the created form and its container element. */
      await KR.removeForms();

      const container = document.getElementById(LYRA_FORM_ID);
      if (container) container.remove();
    };
  }, []);

  useEffect(() => {
    // Abort the payment if the user tries to leave the page.
    window.addEventListener('beforeunload', () => handleError(), { once: true });
  }, []);

  return null;
};

export default LyraPopIn;

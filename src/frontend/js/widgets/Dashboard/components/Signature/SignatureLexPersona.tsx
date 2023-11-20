import { useEffect } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { SignatureProps } from 'components/ContractFrame';
import 'components/ContractFrame/iframe-manager.js';
import { handle } from 'utils/errors/handle';

declare let iframeManager: any;

enum LexPersonaStatus {
  canceled = 'canceled',
  expired = 'expired',
  request = 'request',
}

const messages = defineMessages({
  errorStatus: {
    defaultMessage:
      'An error happened while signing the contract with the following status: {status}. Please refresh to try again.',
    description:
      'Message displayed inside the contract signin modal when Lex Persona iframe returned a non null status.',
    id: 'components.Dashboard.Signature.SignatureLexPersona.errorStatus',
  },
  error: {
    defaultMessage: 'An error happened while signing the contract. Please try again later.',
    description:
      'Message displayed inside the contract signin modal when Lex Persona iframe returned an error.',
    id: 'components.Dashboard.Signature.SignatureLexPersona.error',
  },
});

export const SignatureLexPersona = ({ onDone, onError, invitationLink }: SignatureProps) => {
  const intl = useIntl();
  useEffect(() => {
    iframeManager.open(invitationLink).then(
      (status: LexPersonaStatus) => {
        if (status) {
          onError(intl.formatMessage(messages.errorStatus, { status }));
        } else {
          onDone();
        }
      },
      (error: any) => {
        handle(error);
        onError(intl.formatMessage(messages.error));
      },
    );

    // This is used to set an id to the frame in order to style it.
    // The library does not offer any way to do it natively.
    setTimeout(() => {
      // eslint-disable-next-line compat/compat
      const invitationUrl = new URL(invitationLink);

      const iframes = document.querySelectorAll('iframe');
      const iframe = Array.from(iframes).find((element) => {
        // eslint-disable-next-line compat/compat
        const iframeUrl = new URL(element.src);
        return iframeUrl.origin === invitationUrl.origin;
      });

      if (!iframe) {
        handle(new Error('Cannot find iframe'));
        return;
      }
      iframe.setAttribute('id', 'lex-persona');
    });
  }, []);

  return null;
};

export default SignatureLexPersona;

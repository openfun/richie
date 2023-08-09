import { handle } from 'utils/errors/handle';
import { useAsyncEffect } from 'hooks/useAsyncEffect';
import { PaymentErrorMessageId } from 'components/PaymentButton';
import type { PaymentInterfaceProps } from '.';

/**
 * !!! DEVELOPMENT PURPOSE ONLY !!!
 *
 * Load the dummy payment interface
 *
 */

const DummyPayment = ({ url, payment_id, onSuccess, onError }: PaymentInterfaceProps) => {
  useAsyncEffect(async () => {
    try {
      const response = await fetch(url, {
        body: JSON.stringify({
          state: 'success',
          id: payment_id,
          type: 'payment',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(
          `Payment registration has failed with status ${response.status} - ${response.statusText}`,
        );
      }

      onSuccess();
    } catch (error) {
      handle(error);
      onError(PaymentErrorMessageId.ERROR_DEFAULT);
    }
  }, []);

  return null;
};

export default DummyPayment;

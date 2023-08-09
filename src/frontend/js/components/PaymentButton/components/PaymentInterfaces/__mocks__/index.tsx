import { PaymentErrorMessageId } from 'components/PaymentButton';
import { PaymentInterfaceProps } from '..';

const PaymentInterface = ({ onError, onSuccess }: PaymentInterfaceProps) => (
  <p>
    Payment interface component
    <button
      data-testid="payment-failure"
      onClick={() => onError(PaymentErrorMessageId.ERROR_DEFAULT)}
    >
      Simulate payment failure
    </button>
    <button
      data-testid="payment-abort"
      onClick={() => onError(PaymentErrorMessageId.ERROR_ABORTING)}
    >
      Simulate payment abort
    </button>
    <button data-testid="payment-success" onClick={onSuccess}>
      Simulate payment success
    </button>
  </p>
);

export default PaymentInterface;

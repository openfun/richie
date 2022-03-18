import { render, screen } from '@testing-library/react';
import { handle as mockHandle } from 'utils/errors/handle';
import { ContextFactory as mockContextFactory, PaymentFactory } from 'utils/test/factories';
import type * as Joanie from 'types/Joanie';
import { PaymentProviders } from 'types/Joanie';
import PaymentInterface from '.';

jest.mock('./PayplugLightbox', () => ({
  __esModule: true,
  default: () => 'Payplug lightbox',
}));

jest.mock('utils/errors/handle', () => ({
  handle: jest.fn(),
}));

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockContextFactory().generate(),
}));

describe('PaymentInterface', () => {
  const onSuccess = jest.fn();
  const onError = jest.fn();

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should return null and handle an error if payment provider is not implemented', () => {
    const payment: Joanie.Payment = PaymentFactory.afterGenerate((p: Joanie.Payment) => ({
      ...p,
      provider: 'unknown-provider',
    })).generate();

    const { container } = render(
      <PaymentInterface onSuccess={onSuccess} onError={onError} {...payment} />,
    );

    expect(mockHandle).toHaveBeenCalledWith(
      new Error('Payment provider unknown-provider not implemented'),
    );
    expect(onError).toHaveBeenNthCalledWith(1, 'errorDefault');
    expect(container.childElementCount).toEqual(0);
  });

  it('should render the payplug lightbox when provider is Payplug', async () => {
    const payment: Joanie.Payment = PaymentFactory.afterGenerate((p: Joanie.Payment) => ({
      ...p,
      provider: PaymentProviders.PAYPLUG,
    })).generate();
    render(<PaymentInterface onSuccess={onSuccess} onError={onError} {...payment} />);

    await screen.findByText('Payplug lightbox');
    expect(onError).not.toHaveBeenCalled();
  });
});

import { render, screen } from '@testing-library/react';
import type * as Joanie from 'types/Joanie';
import { PaymentProviders } from 'types/Joanie';
import { handle as mockHandle } from 'utils/errors/handle';
import { ContextFactory as mockContextFactory, PaymentFactory } from 'utils/test/factories';
import PaymentInterface from '.';

jest.mock('./PayplugLightbox', () => ({
  __esModule: true,
  default: () => 'Payplug lightbox',
}));
jest.mock('./Dummy', () => ({
  __esModule: true,
  default: () => 'Dummy payment component',
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

  it('should render the dummy payment component when provider is Dummy', async () => {
    const payment: Joanie.Payment = PaymentFactory.afterGenerate((p: Joanie.Payment) => ({
      ...p,
      provider: PaymentProviders.DUMMY,
    })).generate();
    render(<PaymentInterface onSuccess={onSuccess} onError={onError} {...payment} />);

    await screen.findByText('Dummy payment component');
    expect(onError).not.toHaveBeenCalled();
  });
});

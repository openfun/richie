import KRGlue from '@lyracom/embedded-form-glue';
import { render } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { waitFor } from '@testing-library/dom';
import { LyraPayment, PaymentProviders } from 'components/PaymentInterfaces/types';
import LyraPopIn from './LyraPopIn';

const mockKR: Partial<KR> = {
  renderElements: jest.fn(() =>
    Promise.resolve({
      KR: {} as KR,
      result: { formId: 'form-1' },
    }),
  ),
  closePopin: jest.fn(),
  openPopin: jest.fn(),
  setFormConfig: jest.fn(),
  onFormReady: jest.fn(),
  onError: jest.fn(),
  onSubmit: jest.fn(),
  onPopinClosed: jest.fn(),
  removeForms: jest.fn(),
};

jest.mock('utils/errors/handle');

jest.mock('@lyracom/embedded-form-glue', () => ({
  loadLibrary: jest.fn(() => Promise.resolve({ KR: mockKR })),
}));
const mockKRGlue = KRGlue as jest.Mocked<typeof KRGlue>;

describe('LyraPopIn', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should render the LyraPopIn component', async () => {
    const paymentInfo: LyraPayment = {
      provider_name: PaymentProviders.LYRA,
      form_token: '123',
      configuration: { public_key: '123', base_url: 'https://lyra.api' },
    };

    const result = render(
      <IntlProvider locale="en">
        <LyraPopIn onSuccess={jest.fn()} onError={jest.fn()} {...paymentInfo} />
      </IntlProvider>,
    );

    // Lyra's library should be loaded
    expect(mockKRGlue.loadLibrary).toHaveBeenNthCalledWith(
      1,
      paymentInfo.configuration.base_url,
      paymentInfo.configuration.public_key,
    );

    // Lyra's neon theme should be added to the head
    expect(document.head.innerHTML).toContain(
      'static/js/krypton-client/V4.0/ext/neon-reset.min.css',
    );
    expect(document.head.innerHTML).toContain('/static/js/krypton-client/V4.0/ext/neon.js');

    // Lyra's form should be configured
    await waitFor(() => {
      expect(mockKR.setFormConfig).toHaveBeenNthCalledWith(1, {
        formToken: paymentInfo.form_token,
        'kr-language': 'en',
        'kr-spa-mode': true,
        'kr-z-index': '400',
      });
    });

    // Form container should have been created
    const formContainer = document.getElementById('lyra-form');
    expect(formContainer).toBeInTheDocument();
    expect(formContainer).toHaveClass('kr-embedded');
    expect(formContainer).toHaveAttribute('kr-popin', '');

    // Form should be rendered
    expect(mockKR.renderElements).toHaveBeenCalledTimes(1);

    // Listeners should be set
    expect(mockKR.onSubmit).toHaveBeenCalledTimes(1);
    expect(mockKR.onError).toHaveBeenCalledTimes(1);
    expect(mockKR.onPopinClosed).toHaveBeenCalledTimes(1);
    expect(mockKR.onFormReady).toHaveBeenCalledTimes(1);

    // On unmount, form and its container element should be removed
    result.unmount();
    await waitFor(() => {
      expect(mockKR.removeForms).toHaveBeenCalledTimes(1);
      expect(document.getElementById('lyra-form')).not.toBeInTheDocument();
    });
  });
});

import { act, fireEvent, render, screen } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { Fragment } from 'react';
import { IntlProvider } from 'react-intl';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ContextFactory as mockContextFactory, ProductFactory } from 'utils/test/factories';
import { SessionProvider } from 'data/SessionProvider';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import SaleTunnel from '.';

const StepComponent =
  (title: string) =>
  ({ next }: { next: () => void }) =>
    (
      <Fragment>
        <h2>{title}</h2>
        <button onClick={next}>Next</button>
      </Fragment>
    );

jest.mock('components/SaleTunnelStepValidation', () => ({
  SaleTunnelStepValidation: StepComponent('SaleTunnelStepValidation Component'),
}));
jest.mock('components/SaleTunnelStepPayment', () => ({
  SaleTunnelStepPayment: StepComponent('SaleTunnelStepPayment Component'),
}));
jest.mock('components/SaleTunnelStepResume', () => ({
  SaleTunnelStepResume: StepComponent('SaleTunnelStepResume Component'),
}));
jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockContextFactory({
    authentication: { backend: 'fonzie', endpoint: 'https://auth.endpoint.test' },
    joanie_backend: { endpoint: 'https://joanie.test' },
  }).generate(),
}));

describe('SaleTunnel', () => {
  beforeAll(() => {
    // As dialog is rendered through a Portal, we have to add the DOM element in which the dialog will be rendered.
    const modalExclude = document.createElement('div');
    modalExclude.setAttribute('id', 'modal-exclude');
    document.body.appendChild(modalExclude);
  });

  afterEach(() => {
    fetchMock.restore();
  });

  const Wrapper = ({ client, children }: React.PropsWithChildren<{ client: QueryClient }>) => (
    <IntlProvider locale="en">
      <QueryClientProvider client={client}>
        <SessionProvider>{children}</SessionProvider>
      </QueryClientProvider>
    </IntlProvider>
  );

  it('shows a login button if user is not authenticated', async () => {
    const product = ProductFactory.generate();

    fetchMock.get(`https://joanie.test/api/v1.0/@@products/${product.id}/`, product);

    await act(async () => {
      render(
        <Wrapper client={createTestQueryClient({ user: null })}>
          <SaleTunnel courseCode="00000" product={product} />
        </Wrapper>,
      );
    });

    await screen.findByRole('button', { name: `Login to purchase "${product.title}"` });
  });

  it('shows cta to open sale tunnel when user is authenticated', async () => {
    const product = ProductFactory.generate();
    fetchMock
      .get(`https://joanie.test/api/v1.0/products/${product.id}/`, product)
      .get('https://joanie.test/api/v1.0/addresses/', [])
      .get('https://joanie.test/api/v1.0/credit-cards/', [])
      .get('https://joanie.test/api/v1.0/orders/', []);

    await act(async () => {
      render(
        <Wrapper client={createTestQueryClient({ user: true })}>
          <SaleTunnel courseCode="00000" product={product} />
        </Wrapper>,
      );
    });

    fetchMock.resetHistory();

    // Only CTA is displayed
    const button = screen.getByRole('button', { name: product.call_to_action });

    // we need to fake requestAnimationFrame to test the full behavior of react modal that relies on it for its onAfterOpen callback
    const rafSpy = jest.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(Math.random());
      return Math.random();
    });

    // Then user can enter into the sale tunnel and follow its 3 steps
    await act(async () => {
      fireEvent.click(button);
    });

    // - Dialog should have been displayed
    screen.getByTestId('SaleTunnel__modal');

    // - Step 1 : Validation
    screen.getByRole('heading', { level: 2, name: 'SaleTunnelStepValidation Component' });
    // focus should be set to the current step
    expect(document.activeElement?.getAttribute('aria-current')).toBe('step');
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(fetchMock.calls()).toHaveLength(0);

    // - Step 2 : Payment
    screen.getByRole('heading', { level: 2, name: 'SaleTunnelStepPayment Component' });
    // focus should be set to the current step
    expect(document.activeElement?.getAttribute('aria-current')).toBe('step');
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(fetchMock.calls()).toHaveLength(0);

    // - Step 3 : Resume
    screen.getByRole('heading', { level: 2, name: 'SaleTunnelStepResume Component' });
    // focus should be set to the current step
    expect(document.activeElement?.getAttribute('aria-current')).toBe('step');

    // - Terminated, resume.onExit callback is triggered to refresh course and orders and dialog has been closed
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    const calls = fetchMock.calls();
    expect(calls).toHaveLength(2);
    expect(calls[0][0]).toEqual(`https://joanie.test/api/v1.0/products/${product.id}/`);
    expect(calls[1][0]).toEqual('https://joanie.test/api/v1.0/orders/');

    expect(screen.queryByTestId('SaleTunnel__modal')).toBeNull();
    rafSpy.mockRestore();
  });

  it('renders a sale tunnel with a close button', async () => {
    const product = ProductFactory.generate();

    fetchMock
      .get(`https://joanie.test/api/v1.0/@@products/${product.id}/`, product)
      .get('https://joanie.test/api/v1.0/addresses/', [])
      .get('https://joanie.test/api/v1.0/credit-cards/', [])
      .get('https://joanie.test/api/v1.0/orders/', []);

    await act(async () => {
      render(
        <Wrapper client={createTestQueryClient({ user: true })}>
          <SaleTunnel courseCode="00000" product={product} />
        </Wrapper>,
      );
    });

    fetchMock.resetHistory();

    // Only CTA is displayed
    const $button = screen.getByRole('button', { name: product.call_to_action });

    // Then user can enter into the sale tunnel and follow its 3 steps
    fireEvent.click($button);

    // - Dialog should have been displayed
    screen.getByTestId('SaleTunnel__modal');

    // - A close button should be displayed
    const $closeButton = screen.getByRole('button', { name: 'Close dialog' });

    // - Go to step 2
    screen.getByRole('heading', { level: 2, name: 'SaleTunnelStepValidation Component' });
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    screen.getByRole('heading', { level: 2, name: 'SaleTunnelStepPayment Component' });

    // - Press the escape key should not close the dialog
    fireEvent.keyDown(screen.getByTestId('SaleTunnel__modal'), { keyCode: 27 });
    screen.getByTestId('SaleTunnel__modal');

    // - Click on the overlay area should not close the dialog
    fireEvent.click(document.querySelector('.modal__overlay')!);
    screen.getByTestId('SaleTunnel__modal');

    // - Click on the close button should close the dialog
    fireEvent.click($closeButton);
    expect(screen.queryByTestId('SaleTunnel__modal')).toBeNull();

    // - If user reopens the dialog, the step manager should have been reset so step 1 should be displayed
    fireEvent.click($button);
    screen.getByRole('heading', { level: 2, name: 'SaleTunnelStepValidation Component' });
  });
});

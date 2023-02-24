import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import { Fragment } from 'react';
import { IntlProvider } from 'react-intl';
import { QueryClientProvider } from '@tanstack/react-query';
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

  const Wrapper = ({ children }: React.PropsWithChildren<{}>) => (
    <IntlProvider locale="en">
      <QueryClientProvider client={createTestQueryClient({ user: true })}>
        <SessionProvider>{children}</SessionProvider>
      </QueryClientProvider>
    </IntlProvider>
  );

  it('does not render when isOpen property is false', async () => {
    const product = ProductFactory.generate();

    await act(async () => {
      render(
        <Wrapper>
          <SaleTunnel isOpen={false} product={product} onClose={jest.fn()} />
        </Wrapper>,
      );
    });

    expect(screen.queryByTestId('SaleTunnel__modal')).not.toBeInTheDocument();
  });

  it('renders sale tunnel with working steps when isOpen property is true', async () => {
    const product = ProductFactory.generate();
    fetchMock
      .get('https://joanie.test/api/v1.0/addresses/', [])
      .get('https://joanie.test/api/v1.0/credit-cards/', [])
      .get('https://joanie.test/api/v1.0/orders/', []);

    const onClose = jest.fn();

    await act(async () => {
      render(
        <Wrapper>
          <SaleTunnel isOpen={true} product={product} onClose={onClose} />
        </Wrapper>,
      );
    });

    fetchMock.resetHistory();

    // - Dialog should have been displayed
    screen.getByTestId('SaleTunnel__modal');

    // - Step 1 : Validation
    screen.getByRole('heading', { level: 2, name: 'SaleTunnelStepValidation Component' });
    // focus should be set to the current step
    await waitFor(() => expect(document.activeElement?.getAttribute('aria-current')).toBe('step'));
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));

    // - Step 2 : Payment
    screen.getByRole('heading', { level: 2, name: 'SaleTunnelStepPayment Component' });
    // focus should be set to the current step
    expect(document.activeElement?.getAttribute('aria-current')).toBe('step');
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));

    // - Step 3 : Resume
    screen.getByRole('heading', { level: 2, name: 'SaleTunnelStepResume Component' });
    // focus should be set to the current step
    expect(document.activeElement?.getAttribute('aria-current')).toBe('step');

    // - Terminated, resume.onExit callback is triggered, orders should have been refetched.
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(fetchMock.called('https://joanie.test/api/v1.0/orders/')).toBe(true);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('executes onClose callback when user closes the sale tunnel', async () => {
    const product = ProductFactory.generate();
    fetchMock
      .get('https://joanie.test/api/v1.0/addresses/', [])
      .get('https://joanie.test/api/v1.0/credit-cards/', [])
      .get('https://joanie.test/api/v1.0/orders/', []);

    const onClose = jest.fn();

    await act(async () => {
      render(
        <Wrapper>
          <SaleTunnel isOpen={true} product={product} onClose={onClose} />
        </Wrapper>,
      );
    });

    // - Dialog should have been displayed
    screen.getByTestId('SaleTunnel__modal');

    // - Close the dialog
    const closeButton = screen.getByRole('button', { name: 'Close dialog' });
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

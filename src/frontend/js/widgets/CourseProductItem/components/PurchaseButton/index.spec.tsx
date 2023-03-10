import { act, fireEvent, render, screen } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { IntlProvider } from 'react-intl';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ContextFactory as mockContextFactory, ProductFactory } from 'utils/test/factories';
import { SessionProvider } from 'contexts/SessionContext';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import PurchaseButton from '.';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockContextFactory({
    authentication: { backend: 'fonzie', endpoint: 'https://auth.endpoint.test' },
    joanie_backend: { endpoint: 'https://joanie.test' },
  }).generate(),
}));

describe('PurchaseButton', () => {
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

    await act(async () => {
      render(
        <Wrapper client={createTestQueryClient({ user: null })}>
          <PurchaseButton product={product} disabled={false} />
        </Wrapper>,
      );
    });

    await screen.findByRole('button', { name: `Login to purchase "${product.title}"` });
  });

  it('shows cta to open sale tunnel when user is authenticated', async () => {
    const product = ProductFactory.generate();
    fetchMock
      .get('https://joanie.test/api/v1.0/addresses/', [])
      .get('https://joanie.test/api/v1.0/credit-cards/', [])
      .get('https://joanie.test/api/v1.0/orders/', []);

    await act(async () => {
      render(
        <Wrapper client={createTestQueryClient({ user: true })}>
          <PurchaseButton product={product} disabled={false} />
        </Wrapper>,
      );
    });

    fetchMock.resetHistory();

    // Only CTA is displayed
    const button = screen.getByRole('button', { name: product.call_to_action });

    // - SaleTunnel should not be opened
    expect(screen.queryByTestId('SaleTunnel__modal')).toBeNull();

    // Then user can enter into the sale tunnel and follow its 3 steps
    await act(async () => {
      fireEvent.click(button);
    });

    // - SaleTunnel should have been opened
    screen.getByTestId('SaleTunnel__modal');
  });

  it('renders a disabled CTA if one target course has no course runs', async () => {
    const product = ProductFactory.generate();
    product.target_courses[0].course_runs = [];
    fetchMock
      .get('https://joanie.test/api/v1.0/addresses/', [])
      .get('https://joanie.test/api/v1.0/credit-cards/', [])
      .get('https://joanie.test/api/v1.0/orders/', []);

    await act(async () => {
      render(
        <Wrapper client={createTestQueryClient({ user: true })}>
          <PurchaseButton product={product} disabled={false} />
        </Wrapper>,
      );
    });

    // CTA is displayed but disabled
    const button: HTMLButtonElement = screen.getByRole('button', { name: product.call_to_action });
    expect(button.disabled).toBe(true);

    // Further, a message is displayed to explain why the CTA is disabled
    screen.findByText(
      'At least one course has no course runs, this product is not currently available for sale',
    );
  });

  it('renders a disabled CTA if product has no target courses', async () => {
    const product = ProductFactory.generate();
    product.target_courses = [];
    fetchMock
      .get('https://joanie.test/api/v1.0/addresses/', [])
      .get('https://joanie.test/api/v1.0/credit-cards/', [])
      .get('https://joanie.test/api/v1.0/orders/', []);

    await act(async () => {
      render(
        <Wrapper client={createTestQueryClient({ user: true })}>
          <PurchaseButton product={product} disabled={false} />
        </Wrapper>,
      );
    });

    // CTA is displayed but disabled
    const button: HTMLButtonElement = screen.getByRole('button', { name: product.call_to_action });
    expect(button.disabled).toBe(true);

    // Further, a message is displayed to explain why the CTA is disabled
    screen.findByText(
      'At least one course has no course runs, this product is not currently available for sale',
    );
  });

  it('does not render CTA if disabled property is false', async () => {
    const product = ProductFactory.generate();
    fetchMock
      .get('https://joanie.test/api/v1.0/addresses/', [])
      .get('https://joanie.test/api/v1.0/credit-cards/', [])
      .get('https://joanie.test/api/v1.0/orders/', []);

    await act(async () => {
      render(
        <Wrapper client={createTestQueryClient({ user: true })}>
          <PurchaseButton product={product} disabled={true} />
        </Wrapper>,
      );
    });

    // CTA is not displayed
    expect(screen.queryByRole('button', { name: product.call_to_action })).not.toBeInTheDocument();
  });
});

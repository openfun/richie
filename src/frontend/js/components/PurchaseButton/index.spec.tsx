import { act, render, screen } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { IntlProvider } from 'react-intl';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';
import {
  CourseStateFactory,
  RichieContextFactory as mockRichieContextFactory,
} from 'utils/test/factories/richie';
import { CourseRunFactory, ProductFactory } from 'utils/test/factories/joanie';
import { SessionProvider } from 'contexts/SessionContext';
import { CourseProductProvider } from 'contexts/CourseProductContext';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import { ProductType } from 'types/Joanie';
import { Priority } from 'types';
import PurchaseButton from '.';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: { backend: 'fonzie', endpoint: 'https://auth.endpoint.test' },
    joanie_backend: { endpoint: 'https://joanie.test' },
  }).one(),
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
    <CourseProductProvider courseCode="00000" productId="00000">
      <IntlProvider locale="en">
        <QueryClientProvider client={client}>
          <SessionProvider>{children}</SessionProvider>
        </QueryClientProvider>
      </IntlProvider>
    </CourseProductProvider>
  );

  it('shows a login button if user is not authenticated', async () => {
    const product = ProductFactory().one();

    act(() => {
      render(
        <Wrapper client={createTestQueryClient({ user: null })}>
          <PurchaseButton product={product} disabled={false} />
        </Wrapper>,
      );
    });

    expect(
      await screen.findByRole('button', { name: `Login to purchase "${product.title}"` }),
    ).toBeInTheDocument();
  });

  it('shows cta to open sale tunnel when user is authenticated', async () => {
    const product = ProductFactory().one();
    fetchMock
      .get('https://joanie.test/api/v1.0/addresses/', [])
      .get('https://joanie.test/api/v1.0/credit-cards/', [])
      .get('https://joanie.test/api/v1.0/orders/', []);

    act(() => {
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

    // act is needed here because we've no way, in SaleTunnel, to check useOrder !fetching state from the DOM
    // Then user can enter into the sale tunnel and follow its 3 steps
    await act(async () => userEvent.click(button));

    // - SaleTunnel should have been opened
    expect(screen.getByTestId('SaleTunnel__modal')).toBeInTheDocument();
  });

  it('shows cta to open sale tunnel when remaining orders is null', async () => {
    const product = ProductFactory({ remaining_order_count: null }).one();
    fetchMock
      .get('https://joanie.test/api/v1.0/addresses/', [])
      .get('https://joanie.test/api/v1.0/credit-cards/', [])
      .get('https://joanie.test/api/v1.0/orders/', []);

    act(() => {
      render(
        <Wrapper client={createTestQueryClient({ user: true })}>
          <PurchaseButton product={product} disabled={false} />
        </Wrapper>,
      );
    });

    fetchMock.resetHistory();

    // Only CTA is displayed
    const button = await screen.findByRole('button', { name: product.call_to_action });
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();

    // - SaleTunnel should not be opened
    expect(screen.queryByTestId('SaleTunnel__modal')).not.toBeInTheDocument();

    // act is needed here because we've no way, in SaleTunnel, to check useOrder !fetching state from the DOM
    // Then user can enter into the sale tunnel and follow its 3 steps
    await act(async () => userEvent.click(button));

    // - SaleTunnel should have been opened
    expect(await screen.findByTestId('SaleTunnel__modal')).toBeInTheDocument();
  });

  it('shows cta to open sale tunnel when remaining orders is undefined', async () => {
    const product = ProductFactory().one();
    delete product.remaining_order_count;

    fetchMock
      .get('https://joanie.test/api/v1.0/addresses/', [])
      .get('https://joanie.test/api/v1.0/credit-cards/', [])
      .get('https://joanie.test/api/v1.0/orders/', []);

    act(() => {
      render(
        <Wrapper client={createTestQueryClient({ user: true })}>
          <PurchaseButton product={product} disabled={false} />
        </Wrapper>,
      );
    });

    fetchMock.resetHistory();

    // Only CTA is displayed
    const button = await screen.findByRole('button', { name: product.call_to_action });
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();

    // - SaleTunnel should not be opened
    expect(screen.queryByTestId('SaleTunnel__modal')).not.toBeInTheDocument();

    // act is needed here because we've no way, in SaleTunnel, to check useOrder !fetching state from the DOM
    // Then user can enter into the sale tunnel and follow its 3 steps
    await act(async () => userEvent.click(button));

    // - SaleTunnel should have been opened
    expect(await screen.findByTestId('SaleTunnel__modal')).toBeInTheDocument();
  });

  it('renders a disabled CTA if the product have no remaining orders', async () => {
    const product = ProductFactory({ remaining_order_count: 0 }).one();
    fetchMock
      .get('https://joanie.test/api/v1.0/addresses/', [])
      .get('https://joanie.test/api/v1.0/credit-cards/', [])
      .get('https://joanie.test/api/v1.0/orders/', []);

    act(() => {
      render(
        <Wrapper client={createTestQueryClient({ user: true })}>
          <PurchaseButton product={product} disabled={false} />
        </Wrapper>,
      );
    });

    // CTA is displayed but disabled
    const button: HTMLButtonElement = screen.getByRole('button', { name: product.call_to_action });
    expect(button).toBeDisabled();

    // Further, a message is displayed to explain why the CTA is disabled
    screen.findByText('This product is full, is currently not available for sale');
  });

  it.each([
    { label: 'Product credential', productData: { type: ProductType.CREDENTIAL } },
    {
      label: 'Product credential without remaining orders',
      productData: { remaining_order_count: 0, type: ProductType.CREDENTIAL },
    },
  ])(
    'renders a disabled CTA if one target course has no course runs. Case "$label"',
    async ({ productData }) => {
      const product = ProductFactory(productData).one();
      product.target_courses[0].course_runs = [];
      fetchMock
        .get('https://joanie.test/api/v1.0/addresses/', [])
        .get('https://joanie.test/api/v1.0/credit-cards/', [])
        .get('https://joanie.test/api/v1.0/orders/', []);

      act(() => {
        render(
          <Wrapper client={createTestQueryClient({ user: true })}>
            <PurchaseButton product={product} disabled={false} />
          </Wrapper>,
        );
      });

      // CTA is displayed but disabled
      const button: HTMLButtonElement = screen.getByRole('button', {
        name: product.call_to_action,
      });
      expect(button).toBeDisabled();

      // Further, a message is displayed to explain why the CTA is disabled
      expect(
        await screen.findByText(
          'At least one course has no course runs, this product is not currently available for sale',
        ),
      ).toBeInTheDocument();
    },
  );

  it.each([
    {
      label: 'state: ARCHIVED_CLOSED',
      courseRunStateData: { priority: Priority.ARCHIVED_CLOSED },
    },
    {
      label: 'state: ARCHIVED_OPEN',
      courseRunStateData: { priority: Priority.ARCHIVED_OPEN },
    },
    {
      label: 'state: TO_BE_SCHEDULED',
      courseRunStateData: { priority: Priority.TO_BE_SCHEDULED },
    },
  ])(
    'renders a disabled CTA for product certificate if the linked course run is not open',
    async ({ courseRunStateData }) => {
      const product = ProductFactory({ type: ProductType.CERTIFICATE }).one();
      const courseRun = CourseRunFactory({
        state: CourseStateFactory(courseRunStateData).one(),
      }).one();
      fetchMock
        .get('https://joanie.test/api/v1.0/addresses/', [])
        .get('https://joanie.test/api/v1.0/credit-cards/', [])
        .get('https://joanie.test/api/v1.0/orders/', []);

      act(() => {
        render(
          <Wrapper client={createTestQueryClient({ user: true })}>
            <PurchaseButton product={product} disabled={false} courseRun={courseRun} />
          </Wrapper>,
        );
      });

      // CTA is displayed but disabled
      const button: HTMLButtonElement = await screen.findByRole('button', {
        name: product.call_to_action,
      });
      expect(button).toBeDisabled();

      // Further, a message is displayed to explain why the CTA is disabled
      expect(
        screen.getByText(
          'The course run is not active, this product is not currently available for sale',
        ),
      ).toBeInTheDocument();
    },
  );

  it.each([
    {
      label: 'state: ONGOING_OPEN',
      courseRunStateData: { priority: Priority.ONGOING_OPEN },
    },
    {
      label: 'state: FUTURE_OPEN',
      courseRunStateData: { priority: Priority.FUTURE_OPEN },
    },
    {
      label: 'state: FUTURE_NOT_YET_OPEN',
      courseRunStateData: { priority: Priority.FUTURE_NOT_YET_OPEN },
    },
    {
      label: 'state: FUTURE_CLOSED',
      courseRunStateData: { priority: Priority.FUTURE_CLOSED },
    },
    {
      label: 'state: ONGOING_CLOSED',
      courseRunStateData: { priority: Priority.ONGOING_CLOSED },
    },
  ])(
    'do not renders a disabled CTA for product certificate if the linked course run is open',
    async ({ courseRunStateData }) => {
      const product = ProductFactory({ type: ProductType.CERTIFICATE }).one();
      const courseRun = CourseRunFactory({
        state: CourseStateFactory(courseRunStateData).one(),
      }).one();

      fetchMock
        .get('https://joanie.test/api/v1.0/addresses/', [])
        .get('https://joanie.test/api/v1.0/credit-cards/', [])
        .get('https://joanie.test/api/v1.0/orders/', []);

      act(() => {
        render(
          <Wrapper client={createTestQueryClient({ user: true })}>
            <PurchaseButton product={product} disabled={false} courseRun={courseRun} />
          </Wrapper>,
        );
      });

      // CTA should not be disabled
      const button: HTMLButtonElement = await screen.findByRole('button', {
        name: product.call_to_action,
      });
      expect(button).not.toBeDisabled();

      // No alert message
      expect(
        screen.queryByText(
          'The course run is not active, this product is not currently available for sale',
        ),
      ).not.toBeInTheDocument();
    },
  );

  it('renders a disabled CTA if product has no target courses', async () => {
    const product = ProductFactory().one();
    product.target_courses = [];
    fetchMock
      .get('https://joanie.test/api/v1.0/addresses/', [])
      .get('https://joanie.test/api/v1.0/credit-cards/', [])
      .get('https://joanie.test/api/v1.0/orders/', []);

    act(() => {
      render(
        <Wrapper client={createTestQueryClient({ user: true })}>
          <PurchaseButton product={product} disabled={false} />
        </Wrapper>,
      );
    });

    // CTA is displayed but disabled
    const button: HTMLButtonElement = screen.getByRole('button', { name: product.call_to_action });
    expect(button).toBeDisabled();

    // Further, a message is displayed to explain why the CTA is disabled
    screen.findByText(
      'At least one course has no course runs, this product is not currently available for sale',
    );
  });

  it('does not render CTA if disabled property is false', async () => {
    const product = ProductFactory().one();
    fetchMock
      .get('https://joanie.test/api/v1.0/addresses/', [])
      .get('https://joanie.test/api/v1.0/credit-cards/', [])
      .get('https://joanie.test/api/v1.0/orders/', []);

    act(() => {
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

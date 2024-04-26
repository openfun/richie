import { render, screen } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { IntlProvider } from 'react-intl';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';
import { CunninghamProvider } from '@openfun/cunningham-react';
import {
  CourseStateFactory,
  UserFactory,
  RichieContextFactory as mockRichieContextFactory,
} from 'utils/test/factories/richie';
import {
  CertificateProductFactory,
  CourseLightFactory,
  EnrollmentFactory,
  ProductFactory,
} from 'utils/test/factories/joanie';
import { SessionProvider } from 'contexts/SessionContext';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import { ProductType } from 'types/Joanie';
import { Priority } from 'types';
import { setupJoanieSession } from 'utils/test/wrappers/JoanieAppWrapper';
import { User } from 'types/User';
import { OpenEdxApiProfile } from 'types/openEdx';
import { OpenEdxApiProfileFactory } from 'utils/test/factories/openEdx';
import PurchaseButton from '.';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: { backend: 'fonzie', endpoint: 'https://auth.test' },
    joanie_backend: { endpoint: 'https://joanie.endpoint' },
  }).one(),
}));

jest.mock('utils/indirection/window', () => ({
  matchMedia: () => ({
    matches: true,
    addListener: jest.fn(),
    removeListener: jest.fn(),
  }),
}));

describe('PurchaseButton', () => {
  let richieUser: User;
  let openApiEdxProfile: OpenEdxApiProfile;
  setupJoanieSession();

  beforeEach(() => {
    richieUser = UserFactory().one();
    openApiEdxProfile = OpenEdxApiProfileFactory({
      username: richieUser.username,
      email: richieUser.email,
      name: richieUser.full_name,
    }).one();

    const { 'pref-lang': prefLang, ...openEdxAccount } = openApiEdxProfile;

    fetchMock.get(`https://auth.test/api/user/v1/accounts/${richieUser.username}`, openEdxAccount);
    fetchMock.patch(
      `https://auth.test/api/user/v1/accounts/${richieUser.username}`,
      openEdxAccount,
    );
    fetchMock.get(`https://auth.test/api/user/v1/preferences/${richieUser.username}`, {
      'pref-lang': prefLang,
    });
    fetchMock.get(`https://auth.test/api/v1.0/user/me`, richieUser);
  });

  afterEach(() => {
    fetchMock.restore();
  });

  const Wrapper = ({ client, children }: React.PropsWithChildren<{ client: QueryClient }>) => (
    <IntlProvider locale="en">
      <QueryClientProvider client={client}>
        <SessionProvider>
          <CunninghamProvider>{children}</CunninghamProvider>
        </SessionProvider>
      </QueryClientProvider>
    </IntlProvider>
  );

  it('shows a login button if user is not authenticated', async () => {
    const product = ProductFactory().one();

    render(
      <Wrapper client={createTestQueryClient({ user: null })}>
        <PurchaseButton
          product={product}
          disabled={false}
          course={CourseLightFactory({ code: '00000' }).one()}
        />
      </Wrapper>,
    );

    expect(
      await screen.findByRole('button', { name: `Login to purchase "${product.title}"` }),
    ).toBeInTheDocument();
  });

  it('shows cta to open sale tunnel when user is authenticated', async () => {
    const courseCode = '00000';
    const product = ProductFactory().one();
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/orders/?course_code=${courseCode}&product_id=${product.id}&state=pending&state=validated&state=submitted`,
      {},
    );

    render(
      <Wrapper client={createTestQueryClient({ user: richieUser })}>
        <PurchaseButton
          product={product}
          disabled={false}
          course={CourseLightFactory({ code: courseCode }).one()}
        />
      </Wrapper>,
    );

    fetchMock.resetHistory();

    // Only CTA is displayed
    const button = await screen.findByRole('button', { name: product.call_to_action });

    // - SaleTunnel should not be opened
    expect(screen.queryByTestId('SaleTunnel__modal')).toBeNull();

    await userEvent.click(button);

    // - SaleTunnel should have been opened
    expect(screen.getByTestId('generic-sale-tunnel-payment-step')).toBeInTheDocument();
  });

  it('shows cta to open sale tunnel when remaining orders is null', async () => {
    const user = richieUser;
    const courseCode = '00000';
    const product = ProductFactory({ remaining_order_count: null }).one();
    fetchMock.get(`https://demo.endpoint/api/user/v1/accounts/${user.username}`, {});
    fetchMock.get(`https://demo.endpoint/api/user/v1/preferences/${user.username}`, {});
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/orders/?course_code=${courseCode}&product_id=${product.id}&state=pending&state=validated&state=submitted`,
      {},
    );
    render(
      <Wrapper client={createTestQueryClient({ user })}>
        <PurchaseButton
          product={product}
          disabled={false}
          course={CourseLightFactory({ code: courseCode }).one()}
        />
      </Wrapper>,
    );

    fetchMock.resetHistory();

    // Only CTA is displayed
    const button = await screen.findByRole('button', { name: product.call_to_action });
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();

    // - SaleTunnel should not be opened
    expect(screen.queryByTestId('SaleTunnel__modal')).not.toBeInTheDocument();

    await userEvent.click(button);

    // - SaleTunnel should have been opened
    expect(await screen.findByTestId('generic-sale-tunnel-payment-step')).toBeInTheDocument();
  });

  it('shows cta to open sale tunnel when remaining orders is undefined', async () => {
    const courseCode = '00000';
    const product = ProductFactory().one();
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/orders/?course_code=${courseCode}&product_id=${product.id}&state=pending&state=validated&state=submitted`,
      {},
    );
    delete product.remaining_order_count;

    render(
      <Wrapper client={createTestQueryClient({ user: richieUser })}>
        <PurchaseButton
          product={product}
          disabled={false}
          course={CourseLightFactory({ code: courseCode }).one()}
        />
      </Wrapper>,
    );

    fetchMock.resetHistory();

    // Only CTA is displayed
    const button = await screen.findByRole('button', { name: product.call_to_action });
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();

    // - SaleTunnel should not be opened
    expect(screen.queryByTestId('SaleTunnel__modal')).not.toBeInTheDocument();

    await userEvent.click(button);

    // - SaleTunnel should have been opened
    expect(await screen.findByTestId('generic-sale-tunnel-payment-step')).toBeInTheDocument();
  });

  it('renders a disabled CTA if the product have no remaining orders', async () => {
    const courseCode = '00000';
    const product = ProductFactory({ remaining_order_count: 0 }).one();
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/orders/?course_code=${courseCode}&product_id=${product.id}&state=pending&state=validated&state=submitted`,
      {},
    );
    render(
      <Wrapper client={createTestQueryClient({ user: richieUser })}>
        <PurchaseButton
          product={product}
          disabled={false}
          course={CourseLightFactory({ code: courseCode }).one()}
        />
      </Wrapper>,
    );

    // CTA is displayed but disabled
    const button: HTMLButtonElement = await screen.findByRole('button', {
      name: product.call_to_action,
    });
    expect(button).toBeDisabled();

    // Further, a message is displayed to explain why the CTA is disabled
    await screen.findByText('There are no more places available for this product.');
  });

  it.each([
    { label: 'Product credential', productData: {} },
    {
      label: 'Product credential without remaining orders',
      productData: { remaining_order_count: 0 },
    },
  ])(
    'renders a disabled CTA if one target course has no course runs. Case "$label"',
    async ({ productData }) => {
      const courseCode = '00000';
      const product = ProductFactory({ ...productData, type: ProductType.CREDENTIAL }).one();
      product.target_courses[0].course_runs = [];
      fetchMock.get(
        `https://joanie.endpoint/api/v1.0/orders/?course_code=${courseCode}&product_id=${product.id}&state=pending&state=validated&state=submitted`,
        {},
      );

      render(
        <Wrapper client={createTestQueryClient({ user: richieUser })}>
          <PurchaseButton
            product={product}
            disabled={false}
            course={CourseLightFactory({ code: courseCode }).one()}
          />
        </Wrapper>,
      );

      // CTA is displayed but disabled
      const button: HTMLButtonElement = await screen.findByRole('button', {
        name: product.call_to_action,
      });
      expect(button).toBeDisabled();

      // Further, a message is displayed to explain why the CTA is disabled
      expect(
        await screen.findByText(
          'At least one course has no course runs. This product is not currently available for sale.',
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
      const product = CertificateProductFactory().one();
      const enrollment = EnrollmentFactory().one();
      enrollment.course_run.state = CourseStateFactory(courseRunStateData).one();
      fetchMock.get(
        `https://joanie.endpoint/api/v1.0/orders/?enrollment_id=${enrollment.id}&product_id=${product.id}&state=pending&state=validated&state=submitted`,
        {},
      );

      render(
        <Wrapper client={createTestQueryClient({ user: true })}>
          <PurchaseButton product={product} disabled={false} enrollment={enrollment} />
        </Wrapper>,
      );

      // CTA is displayed but disabled
      const button: HTMLButtonElement = await screen.findByRole('button', {
        name: product.call_to_action,
      });
      expect(button).toBeDisabled();

      // Further, a message is displayed to explain why the CTA is disabled
      expect(
        screen.getByText(
          'The course run is not active. This product is not currently available for sale.',
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
      const product = CertificateProductFactory().one();
      const enrollment = EnrollmentFactory().one();
      enrollment.course_run.state = CourseStateFactory(courseRunStateData).one();

      fetchMock.get(
        `https://joanie.endpoint/api/v1.0/orders/?enrollment_id=${enrollment.id}&product_id=${product.id}&state=pending&state=validated&state=submitted`,
        {},
      );

      render(
        <Wrapper client={createTestQueryClient({ user: true })}>
          <PurchaseButton product={product} disabled={false} enrollment={enrollment} />
        </Wrapper>,
      );

      // CTA should not be disabled
      const button: HTMLButtonElement = await screen.findByRole('button', {
        name: product.call_to_action,
      });
      expect(button).not.toBeDisabled();

      // No alert message
      expect(
        screen.queryByText(
          'The course run is not active. This product is not currently available for sale.',
        ),
      ).not.toBeInTheDocument();
    },
  );

  it('renders a disabled CTA if product has no target courses', async () => {
    const courseCode = '00000';
    const product = ProductFactory().one();
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/orders/?course_code=${courseCode}&product_id=${product.id}&state=pending&state=validated&state=submitted`,
      {},
    );
    product.target_courses = [];

    render(
      <Wrapper client={createTestQueryClient({ user: true })}>
        <PurchaseButton
          product={product}
          disabled={false}
          course={CourseLightFactory({ code: courseCode }).one()}
        />
      </Wrapper>,
    );

    // CTA is displayed but disabled
    const button: HTMLButtonElement = await screen.findByRole('button', {
      name: product.call_to_action,
    });
    expect(button).toBeDisabled();

    // Further, a message is displayed to explain why the CTA is disabled
    await screen.findByText(
      'At least one course has no course runs. This product is not currently available for sale.',
    );
  });

  it('does not render CTA if disabled property is false', async () => {
    const courseCode = '00000';
    const product = ProductFactory().one();
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/orders/?course_code=${courseCode}&product_id=${product.id}&state=pending&state=validated&state=submitted`,
      {},
    );

    render(
      <Wrapper client={createTestQueryClient({ user: true })}>
        <PurchaseButton
          product={product}
          disabled={true}
          course={CourseLightFactory({ code: courseCode }).one()}
        />
      </Wrapper>,
    );

    // CTA is not displayed
    expect(screen.queryByRole('button', { name: product.call_to_action })).not.toBeInTheDocument();
  });
});

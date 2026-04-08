import fetchMock from 'fetch-mock';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import queryString from 'query-string';
import {
  RichieContextFactory as mockRichieContextFactory,
  PacedCourseFactory,
  UserFactory,
} from 'utils/test/factories/richie';
import { setupJoanieSession } from 'utils/test/wrappers/JoanieAppWrapper';
import {
  AddressFactory,
  CredentialOrderFactory,
  CredentialProductFactory,
} from 'utils/test/factories/joanie';
import type * as Joanie from 'types/Joanie';
import { NOT_CANCELED_ORDER_STATES } from 'types/Joanie';
import { SaleTunnel, SaleTunnelProps } from 'components/SaleTunnel/index';
import { render } from 'utils/test/render';
import { getAddressLabel } from 'components/SaleTunnel/AddressSelector';
import { User } from 'types/User';
import { OpenEdxApiProfile } from 'types/openEdx';
import { OpenEdxApiProfileFactory } from 'utils/test/factories/openEdx';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: { backend: 'fonzie', endpoint: 'https://auth.test' },
    joanie_backend: { endpoint: 'https://joanie.endpoint' },
    site_urls: {
      terms_and_conditions: '/en/about/terms-and-conditions/',
    },
  }).one(),
}));

jest.mock('utils/indirection/window', () => ({
  matchMedia: () => ({
    matches: true,
    addListener: jest.fn(),
    removeListener: jest.fn(),
  }),
}));

jest.mock('../PaymentInterfaces');

/**
 * This test file contains Sale Tunnel tests exclusively related to the Credential product.
 */

describe('SaleTunnel / Credential', () => {
  let richieUser: User;
  let openApiEdxProfile: OpenEdxApiProfile;

  const Wrapper = (props: Omit<SaleTunnelProps, 'isWithdrawable' | 'isOpen' | 'onClose'>) => {
    return <SaleTunnel {...props} isWithdrawable={true} isOpen={true} onClose={() => {}} />;
  };

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

  it('should create an order with an order group', async () => {
    const course = PacedCourseFactory().one();
    const product = CredentialProductFactory().one();
    const billingAddress: Joanie.Address = AddressFactory({ is_main: true }).one();

    const order = CredentialOrderFactory().one();
    const orderQueryParameters = {
      course_code: course.code,
      product_id: product.id,
      state: NOT_CANCELED_ORDER_STATES,
    };
    const url = `https://joanie.endpoint/api/v1.0/orders/?${queryString.stringify(orderQueryParameters)}`;
    fetchMock
      .get(url, [])
      .get(
        `https://joanie.endpoint/api/v1.0/courses/${course.code}/products/${product.id}/payment-plan/`,
        [],
      )
      .post('https://joanie.endpoint/api/v1.0/orders/', order)
      .get('https://joanie.endpoint/api/v1.0/addresses/', [billingAddress], {
        overwriteRoutes: true,
      })
      .get(
        `https://joanie.endpoint/api/v1.0/courses/${course.code}/products/${product.id}/deep-link/`,
        {},
      );

    render(<Wrapper product={product} course={course} />, {
      queryOptions: { client: createTestQueryClient({ user: richieUser }) },
    });

    // - wait for address to be loaded.
    await screen.findByText(getAddressLabel(billingAddress));

    const $button = screen.getByRole('button', {
      name: `Subscribe`,
    }) as HTMLButtonElement;

    // - Payment button should not be disabled.
    expect($button.disabled).toBe(false);
  });

  it('should display CPF payment option and redirect to deepLink when deepLink is available', async () => {
    const course = PacedCourseFactory().one();
    const product = CredentialProductFactory().one();
    const billingAddress: Joanie.Address = AddressFactory({ is_main: true }).one();
    const deepLink = 'https://placeholder.com/course/1';
    const orderQueryParameters = {
      course_code: course.code,
      product_id: product.id,
      state: NOT_CANCELED_ORDER_STATES,
    };

    fetchMock
      .get(
        `https://joanie.endpoint/api/v1.0/orders/?${queryString.stringify(orderQueryParameters)}`,
        [],
      )
      .get(
        `https://joanie.endpoint/api/v1.0/courses/${course.code}/products/${product.id}/payment-plan/`,
        [],
      )
      .get(
        `https://joanie.endpoint/api/v1.0/courses/${course.code}/products/${product.id}/deep-link/`,
        { deep_link: deepLink },
      )
      .get('https://joanie.endpoint/api/v1.0/addresses/', [billingAddress], {
        overwriteRoutes: true,
      });

    window.open = jest.fn();
    const user = userEvent.setup({ delay: null });

    render(<Wrapper product={product} course={course} />, {
      queryOptions: { client: createTestQueryClient({ user: richieUser }) },
    });

    await screen.findByRole('heading', { level: 3, name: /payment method/i });

    // - By default, credit card payment should be selected.
    expect(screen.getByRole('radio', { name: /credit card payment/i })).toBeChecked();
    expect(screen.getByRole('radio', { name: /my training account \(cpf\)/i })).not.toBeChecked();

    await user.click(screen.getByRole('radio', { name: /my training account \(cpf\)/i }));

    // - CPF description and redirect button should be visible.
    expect(
      screen.getByText(/pay for your training using your personal training account/i),
    ).toBeInTheDocument();
    const cpfButton = screen.getByRole('link', { name: /go to mon compte formation/i });

    await user.click(cpfButton);
  });

  it('should not display CPF payment option when deepLink is null', async () => {
    const course = PacedCourseFactory().one();
    const product = CredentialProductFactory().one();
    const billingAddress: Joanie.Address = AddressFactory({ is_main: true }).one();
    const orderQueryParameters = {
      course_code: course.code,
      product_id: product.id,
      state: NOT_CANCELED_ORDER_STATES,
    };

    fetchMock
      .get(
        `https://joanie.endpoint/api/v1.0/orders/?${queryString.stringify(orderQueryParameters)}`,
        [],
      )
      .get(
        `https://joanie.endpoint/api/v1.0/courses/${course.code}/products/${product.id}/payment-plan/`,
        [],
      )
      .get(
        `https://joanie.endpoint/api/v1.0/courses/${course.code}/products/${product.id}/deep-link/`,
        { deep_link: null },
      )
      .get('https://joanie.endpoint/api/v1.0/addresses/', [billingAddress], {
        overwriteRoutes: true,
      });

    render(<Wrapper product={product} course={course} />, {
      queryOptions: { client: createTestQueryClient({ user: richieUser }) },
    });

    // - wait for address to be loaded.
    await screen.findByText(getAddressLabel(billingAddress));

    // - Payment method section and CPF option should not be rendered.
    expect(
      screen.queryByRole('heading', { level: 3, name: /payment method/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('radio', { name: /my training account \(cpf\)/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('radio', { name: /credit card payment/i })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: /go to mon compte formation/i }),
    ).not.toBeInTheDocument();

    // - Classic billing information section should be displayed.
    expect(screen.getByText(/this information will be used for billing/i)).toBeInTheDocument();
  });

  it('should display voucher input and subscribe button in CPF mode', async () => {
    const course = PacedCourseFactory().one();
    const product = CredentialProductFactory().one();
    const billingAddress: Joanie.Address = AddressFactory({ is_main: true }).one();
    const deepLink = 'https://placeholder.com/course/1';
    const orderQueryParameters = {
      course_code: course.code,
      product_id: product.id,
      state: NOT_CANCELED_ORDER_STATES,
    };

    fetchMock
      .get(
        `https://joanie.endpoint/api/v1.0/orders/?${queryString.stringify(orderQueryParameters)}`,
        [],
      )
      .get(
        `https://joanie.endpoint/api/v1.0/courses/${course.code}/products/${product.id}/payment-plan/`,
        [],
      )
      .get(
        `https://joanie.endpoint/api/v1.0/courses/${course.code}/products/${product.id}/deep-link/`,
        { deep_link: deepLink },
      )
      .get('https://joanie.endpoint/api/v1.0/addresses/', [billingAddress], {
        overwriteRoutes: true,
      });

    const user = userEvent.setup({ delay: null });

    render(<Wrapper product={product} course={course} />, {
      queryOptions: { client: createTestQueryClient({ user: richieUser }) },
    });

    await screen.findByRole('heading', { level: 3, name: /payment method/i });

    // Switch to CPF mode
    await user.click(screen.getByRole('radio', { name: /my training account \(cpf\)/i }));

    // - Voucher input should be visible in CPF mode.
    expect(screen.getByLabelText('Voucher code')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Validate' })).toBeInTheDocument();

    // - Subscribe button should be visible in CPF mode.
    expect(screen.getByRole('button', { name: 'Subscribe' })).toBeInTheDocument();
  });
});

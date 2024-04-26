import fetchMock from 'fetch-mock';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import {
  RichieContextFactory as mockRichieContextFactory,
  UserFactory,
} from 'utils/test/factories/richie';
import { setupJoanieSession } from 'utils/test/wrappers/JoanieAppWrapper';
import {
  AddressFactory,
  CourseFactory,
  CredentialOrderWithPaymentFactory,
  CredentialProductFactory,
  OrderGroupFactory,
} from 'utils/test/factories/joanie';
import type * as Joanie from 'types/Joanie';
import { Maybe } from 'types/utils';
import { OrderCredentialCreationPayload } from 'types/Joanie';
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

  const Wrapper = (props: Omit<SaleTunnelProps, 'isOpen' | 'onClose'>) => {
    return <SaleTunnel {...props} isOpen={true} onClose={() => {}} />;
  };

  const formatPrice = (price: number, currency: string) =>
    new Intl.NumberFormat('en', {
      currency,
      style: 'currency',
    }).format(price);

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
    const course = CourseFactory().one();
    const product = CredentialProductFactory().one();
    const orderGroup = OrderGroupFactory().one();
    const billingAddress: Joanie.Address = AddressFactory({ is_main: true }).one();

    let createOrderPayload: Maybe<OrderCredentialCreationPayload>;
    const { payment_info: paymentInfo, ...order } = CredentialOrderWithPaymentFactory().one();
    fetchMock
      .get(
        `https://joanie.endpoint/api/v1.0/orders/?course_code=${course.code}&product_id=${product.id}&state=pending&state=validated&state=submitted`,
        [],
      )
      .post('https://joanie.endpoint/api/v1.0/orders/', (url, { body }) => {
        createOrderPayload = JSON.parse(body as any);
        return order;
      })
      .patch(`https://joanie.endpoint/api/v1.0/orders/${order.id}/submit/`, {
        paymentInfo,
      })
      .get(`https://joanie.endpoint/api/v1.0/orders/${order.id}/`, {
        ...order,
      })
      .get('https://joanie.endpoint/api/v1.0/addresses/', [billingAddress], {
        overwriteRoutes: true,
      });

    render(<Wrapper product={product} course={course} orderGroup={orderGroup} />, {
      queryOptions: { client: createTestQueryClient({ user: richieUser }) },
    });

    // - wait for address to be loaded.
    await screen.findByText(getAddressLabel(billingAddress));

    const $button = screen.getByRole('button', {
      name: `Pay ${formatPrice(product.price, product.price_currency)}`,
    }) as HTMLButtonElement;

    const $terms = screen.getByLabelText(
      'By checking this box, you accept the General Terms of Sale',
    );
    await act(async () => {
      fireEvent.click($terms);
    });

    // - Payment button should not be disabled.
    expect($button.disabled).toBe(false);

    // - User clicks on pay button
    await act(async () => {
      fireEvent.click($button);
    });

    await waitFor(() => expect(createOrderPayload?.order_group_id).toEqual(orderGroup.id));
  });
});

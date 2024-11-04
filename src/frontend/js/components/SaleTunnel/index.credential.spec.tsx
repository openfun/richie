import fetchMock from 'fetch-mock';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
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
  OrderGroupFactory,
} from 'utils/test/factories/joanie';
import type * as Joanie from 'types/Joanie';
import { Maybe } from 'types/utils';
import { NOT_CANCELED_ORDER_STATES, OrderCredentialCreationPayload } from 'types/Joanie';
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
    const orderGroup = OrderGroupFactory().one();
    const billingAddress: Joanie.Address = AddressFactory({ is_main: true }).one();

    let createOrderPayload: Maybe<OrderCredentialCreationPayload>;
    const order = CredentialOrderFactory({ order_group_id: orderGroup.id }).one();
    const orderQueryParameters = {
      course_code: course.code,
      product_id: product.id,
      state: NOT_CANCELED_ORDER_STATES,
    };
    const url = `https://joanie.endpoint/api/v1.0/orders/?${queryString.stringify(orderQueryParameters)}`;
    fetchMock
      .get(url, [])
      .get(
        `https://joanie.endpoint/api/v1.0/courses/${course.code}/products/${product.id}/payment-schedule/`,
        [],
      )
      .post('https://joanie.endpoint/api/v1.0/orders/', (_, { body }) => {
        createOrderPayload = JSON.parse(body as any);
        return order;
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
      name: `Subscribe`,
    }) as HTMLButtonElement;

    // - Payment button should not be disabled.
    expect($button.disabled).toBe(false);

    // - User clicks on pay button
    await act(async () => {
      fireEvent.click($button);
    });

    await waitFor(() => expect(createOrderPayload?.order_group_id).toEqual(orderGroup.id));
  });
});

import countries from 'i18n-iso-countries';
import fetchMock from 'fetch-mock';
import { getByText, render, screen, waitFor } from '@testing-library/react';
import userEvent, { UserEvent } from '@testing-library/user-event';
import { PropsWithChildren } from 'react';
import {
  UserFactory,
  RichieContextFactory as mockRichieContextFactory,
} from 'utils/test/factories/richie';
import { AddressFactory } from 'utils/test/factories/joanie';
import { DashboardTest } from 'widgets/Dashboard/components/DashboardTest';
import { Address } from 'types/Joanie';
import { expectFetchCall } from 'utils/test/expectFetchCall';
import { expectBreadcrumbsToEqualParts } from 'utils/test/expectBreadcrumbsToEqualParts';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import { expectBannerError } from 'utils/test/expectBanner';
import { changeSelect } from 'components/Form/test-utils';
import { HttpStatusCode } from 'utils/errors/HttpError';

import { LearnerDashboardPaths } from 'widgets/Dashboard/utils/learnerRoutesPaths';
import { User } from 'types/User';
import { BaseJoanieAppWrapper } from 'utils/test/wrappers/BaseJoanieAppWrapper';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: { backend: 'fonzie', endpoint: 'https://demo.endpoint' },
    joanie_backend: { endpoint: 'https://joanie.endpoint' },
  }).one(),
}));

jest.mock('utils/indirection/window', () => ({
  confirm: jest.fn(() => true),
}));

/**
 * Fills the form with `address` data.
 * @param address
 */
const fillForm = async (address: Address, user: UserEvent = userEvent.setup()) => {
  const $titleInput = await screen.findByRole('textbox', { name: 'Address title' });
  const $firstnameInput = screen.getByRole('textbox', { name: "Recipient's first name" });
  const $lastnameInput = screen.getByRole('textbox', { name: "Recipient's last name" });
  const $addressInput = screen.getByRole('textbox', { name: 'Address' });
  const $cityInput = screen.getByRole('textbox', { name: 'City' });
  const $postcodeInput = screen.getByRole('textbox', { name: 'Postcode' });
  const $countryInput = screen.getByRole('combobox', { name: 'Country' });

  await user.type($titleInput, address?.title);
  await user.type($firstnameInput, address?.first_name);
  await user.type($lastnameInput, address?.last_name);
  await user.type($addressInput, address?.address);
  await user.type($cityInput, address?.city);
  await user.type($postcodeInput, address?.postcode);
  await changeSelect($countryInput, countries.getName(address?.country, 'en')!, user);

  return Promise.resolve();
};

describe('<DashboardCreateAddress/>', () => {
  let richieUser: User;
  const Wrapper = ({ children }: PropsWithChildren) => {
    const client = createTestQueryClient({ user: richieUser });
    return <BaseJoanieAppWrapper queryOptions={{ client }}>{children}</BaseJoanieAppWrapper>;
  };
  let user: UserEvent;

  beforeEach(() => {
    richieUser = UserFactory().one();
    user = userEvent.setup();
    fetchMock.get('https://joanie.endpoint/api/v1.0/orders/', []);
    fetchMock.get('https://joanie.endpoint/api/v1.0/credit-cards/', []);
  });

  afterEach(() => {
    jest.clearAllMocks();
    fetchMock.restore();
  });

  it('renders error for each field', async () => {
    fetchMock.get('https://joanie.endpoint/api/v1.0/addresses/', []);
    render(
      <Wrapper>
        <DashboardTest initialRoute={LearnerDashboardPaths.PREFERENCES_ADDRESS_CREATION} />
      </Wrapper>,
    );
    await waitFor(() => {
      expect(fetchMock.calls().map((call) => call[0])).toContain(
        'https://joanie.endpoint/api/v1.0/addresses/',
      );
    });

    // It doesn't show any errors.
    expect(screen.queryByText('An error occurred', { exact: false })).toBeNull();
    expectBreadcrumbsToEqualParts(['chevron_leftBack', 'My preferences', 'Create address']);

    // Submit the empty form to trigger validation errors.
    await user.click(screen.getByRole('button', { name: 'Create' }));

    const titleInput = screen.getByRole('textbox', { name: 'Address title' });
    const firstnameInput = screen.getByRole('textbox', { name: "Recipient's first name" });
    const lastnameInput = screen.getByRole('textbox', { name: "Recipient's last name" });
    const addressInput = screen.getByRole('textbox', { name: 'Address' });
    const cityInput = screen.getByRole('textbox', { name: 'City' });
    const postcodeInput = screen.getByRole('textbox', { name: 'Postcode' });
    const countryInput = screen.getByRole('combobox', { name: 'Country' });

    getByText(titleInput.closest('.c__field')!, 'This field is required.');
    getByText(firstnameInput.closest('.c__field')!, 'This field is required.');
    getByText(lastnameInput.closest('.c__field')!, 'This field is required.');
    getByText(addressInput.closest('.c__field')!, 'This field is required.');
    getByText(cityInput.closest('.c__field')!, 'This field is required.');
    getByText(postcodeInput.closest('.c__field')!, 'This field is required.');
    getByText(countryInput.closest('.c__field')!, 'You must select a value.');

    // The create API route is not called.
    expect(
      fetchMock.called('https://joanie.endpoint/api/v1.0/addresses/', { method: 'post' }),
    ).toBe(false);

    // Make sure it stays on the same route.
    await screen.findByText('Create an address');
  });

  it('creates an address and redirect to preferences', async () => {
    fetchMock.get('https://demo.endpoint/api/v1.0/user/me', richieUser);
    fetchMock.get('https://joanie.endpoint/api/v1.0/addresses/', []);
    fetchMock.post('https://joanie.endpoint/api/v1.0/addresses/', []);

    render(
      <Wrapper>
        <DashboardTest initialRoute={LearnerDashboardPaths.PREFERENCES_ADDRESS_CREATION} />
      </Wrapper>,
    );
    await waitFor(() => {
      expect(fetchMock.calls().map((call) => call[0])).toContain(
        'https://joanie.endpoint/api/v1.0/addresses/',
      );
    });
    expectBreadcrumbsToEqualParts(['chevron_leftBack', 'My preferences', 'Create address']);

    // Fill the form with random data.
    const address = AddressFactory().one();
    await fillForm(address, user);

    // Form submit calls the API create route.
    fetchMock.get(`https://demo.endpoint/api/user/v1/accounts/${richieUser.username}`, {});
    fetchMock.get(`https://demo.endpoint/api/user/v1/preferences/${richieUser.username}`, {});

    expect(
      fetchMock.called('https://joanie.endpoint/api/v1.0/addresses/', { method: 'post' }),
    ).toBe(false);
    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(
      fetchMock.called('https://joanie.endpoint/api/v1.0/addresses/', { method: 'post' }),
    ).toBe(true);

    // The API is called with correct body.
    const { id, ...addressResponse } = address;
    const expectedBody = { ...addressResponse, is_main: true };
    expectFetchCall(
      'https://joanie.endpoint/api/v1.0/addresses/',
      { method: 'post' },
      {
        body: expectedBody,
      },
    );

    await waitFor(() => {
      expect(screen.getByText('Billing addresses')).toBeInTheDocument();
    });
  });

  it('shows an error in case of API error', async () => {
    fetchMock.get('https://joanie.endpoint/api/v1.0/addresses/', []);

    // Mock the create API route to return a 500 status.
    fetchMock.post('https://joanie.endpoint/api/v1.0/addresses/', {
      status: HttpStatusCode.INTERNAL_SERVER_ERROR,
      body: 'Bad request',
    });

    render(
      <Wrapper>
        <DashboardTest initialRoute={LearnerDashboardPaths.PREFERENCES_ADDRESS_CREATION} />
      </Wrapper>,
    );
    await waitFor(() => {
      expect(fetchMock.calls().map((call) => call[0])).toContain(
        'https://joanie.endpoint/api/v1.0/addresses/',
      );
    });

    expectBreadcrumbsToEqualParts(['chevron_leftBack', 'My preferences', 'Create address']);

    // Fill the form with random data.
    const address = AddressFactory().one();
    await fillForm(address);

    // The create API route is called when submitting form.
    expect(
      fetchMock.called('https://joanie.endpoint/api/v1.0/addresses/', { method: 'post' }),
    ).toBe(false);

    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(
      fetchMock.called('https://joanie.endpoint/api/v1.0/addresses/', { method: 'post' }),
    ).toBe(true);

    await expectBannerError('An error occurred while creating the address. Please retry later.');
  });
});

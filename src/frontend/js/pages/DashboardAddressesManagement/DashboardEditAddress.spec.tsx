import { QueryClientProvider } from '@tanstack/react-query';
import fetchMock from 'fetch-mock';
import {
  act,
  findByText,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import { AddressFactory } from 'utils/test/factories/joanie';
import { SessionProvider } from 'contexts/SessionContext';
import { DashboardTest } from 'widgets/Dashboard/components/DashboardTest';
import { LearnerDashboardPaths } from 'widgets/Dashboard/utils/learnerRouteMessages';
import { expectFetchCall } from 'utils/test/expectFetchCall';
import { expectBreadcrumbsToEqualParts } from 'utils/test/expectBreadcrumbsToEqualParts';
import JoanieSessionProvider from 'contexts/SessionContext/JoanieSessionProvider';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import { HttpStatusCode } from 'utils/errors/HttpError';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: { backend: 'fonzie', endpoint: 'https://demo.endpoint' },
    joanie_backend: { endpoint: 'https://joanie.endpoint' },
  }).one(),
}));

describe('<DashboardEditAddress/>', () => {
  beforeEach(() => {
    fetchMock.get('https://joanie.endpoint/api/v1.0/orders/', []);
    fetchMock.get('https://joanie.endpoint/api/v1.0/credit-cards/', []);
  });

  afterEach(() => {
    jest.clearAllMocks();
    fetchMock.restore();
  });

  it('updates an address', async () => {
    const address = AddressFactory().one();
    const addressUpdated = AddressFactory().one();
    // It must keep the same id.
    addressUpdated.id = address.id;
    fetchMock.get('https://joanie.endpoint/api/v1.0/addresses/', [address]);
    const updateUrl = 'https://joanie.endpoint/api/v1.0/addresses/' + address.id + '/';
    fetchMock.put(updateUrl, HttpStatusCode.OK);

    await act(async () => {
      render(
        <QueryClientProvider client={createTestQueryClient({ user: true })}>
          <IntlProvider locale="en">
            <SessionProvider>
              <DashboardTest
                initialRoute={LearnerDashboardPaths.PREFERENCES_ADDRESS_EDITION.replace(
                  ':addressId',
                  address.id,
                )}
              />
            </SessionProvider>
          </IntlProvider>
        </QueryClientProvider>,
      );
    });

    // It doesn't show any errors.
    expect(screen.queryByText('An error occurred', { exact: false })).toBeNull();
    expectBreadcrumbsToEqualParts([
      'chevron_leftBack',
      'My preferences',
      'Edit address "' + address.title + '"',
    ]);

    // The form fields are correctly set to the `address` ones.
    const $button = await screen.findByRole('button', { name: 'Save updates' });
    const $titleInput: HTMLInputElement = screen.getByRole('textbox', { name: 'Address title' });
    const $firstnameInput: HTMLInputElement = screen.getByRole('textbox', {
      name: "Recipient's first name",
    });
    const $lastnameInput: HTMLInputElement = screen.getByRole('textbox', {
      name: "Recipient's last name",
    });
    const $addressInput: HTMLInputElement = screen.getByRole('textbox', { name: 'Address' });
    const $cityInput: HTMLInputElement = screen.getByRole('textbox', { name: 'City' });
    const $postcodeInput: HTMLInputElement = screen.getByRole('textbox', { name: 'Postcode' });
    const $countryInput: HTMLSelectElement = screen.getByRole('combobox', { name: 'Country' });

    await waitFor(() => expect($titleInput.value).toBe(address.title));
    expect($firstnameInput.value).toBe(address.first_name);
    expect($lastnameInput.value).toBe(address.last_name);
    expect($addressInput.value).toBe(address.address);
    expect($cityInput.value).toBe(address.city);
    expect($postcodeInput.value).toBe(address.postcode);
    expect(within($countryInput).getByDisplayValue(address.country)).toBeInTheDocument();

    // Mock refresh route.
    fetchMock.get('https://joanie.endpoint/api/v1.0/addresses/', [addressUpdated], {
      overwriteRoutes: true,
    });

    // Submit of the form calls the API edit route.
    expect(fetchMock.called(updateUrl, { method: 'put' })).toBe(false);
    await act(async () => {
      // it is not necessary to update all fields as it is mocked above.
      fireEvent.change($titleInput, { target: { value: addressUpdated.title } });
      fireEvent.click($button);
    });
    expect(fetchMock.called(updateUrl, { method: 'put' })).toBe(true);

    // The API is called with correct body.
    const { id, ...addressResponse } = address;
    const expectedBody = { ...addressResponse, title: addressUpdated.title };
    expectFetchCall(
      updateUrl,
      { method: 'put' },
      {
        body: expectedBody,
      },
    );

    // The redirect to addresses list worked and now the list shows the updated address.
    await screen.findByText(addressUpdated.title);
    expect(screen.queryByText(address.title)).toBeNull();
  });

  it('shows an error in case of API error', async () => {
    const address = AddressFactory().one();
    fetchMock.get('https://joanie.endpoint/api/v1.0/addresses/', [address]);

    // Mock the edit API route to return a 500 status.
    const updateUrl = 'https://joanie.endpoint/api/v1.0/addresses/' + address.id + '/';
    fetchMock.put(updateUrl, { status: HttpStatusCode.INTERNAL_SERVER_ERROR, body: 'Bad request' });

    let container: HTMLElement | undefined;
    await act(async () => {
      container = render(
        <QueryClientProvider client={createTestQueryClient({ user: true })}>
          <IntlProvider locale="en">
            <JoanieSessionProvider>
              <DashboardTest
                initialRoute={LearnerDashboardPaths.PREFERENCES_ADDRESS_EDITION.replace(
                  ':addressId',
                  address.id,
                )}
              />
            </JoanieSessionProvider>
          </IntlProvider>
        </QueryClientProvider>,
      ).container;
    });

    expectBreadcrumbsToEqualParts([
      'chevron_leftBack',
      'My preferences',
      'Edit address "' + address.title + '"',
    ]);
    // It doesn't show any errors.
    expect(screen.queryByText('An error occurred', { exact: false })).toBeNull();

    // The edit route API is called when submitting.
    const button = await screen.findByRole('button', { name: 'Save updates' });

    // Make sure the form is loaded.
    const titleInput: HTMLInputElement = screen.getByRole('textbox', { name: 'Address title' });
    await waitFor(() => expect(titleInput.value).toBe(address.title));

    expect(fetchMock.called(updateUrl, { method: 'put' })).toBe(false);
    await act(async () => {
      fireEvent.click(button);
    });
    await waitFor(() => expect(fetchMock.called(updateUrl, { method: 'put' })).toBe(true));

    // An error banner is shown.
    const banner = container!.querySelector('.banner--error') as HTMLElement;
    expect(banner).not.toBeNull();
    await findByText(banner!, 'An error occurred while updating the address. Please retry later.');
  });
});

import { QueryClientProvider } from '@tanstack/react-query';
import fetchMock from 'fetch-mock';
import { act, findByText, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import userEvent from '@testing-library/user-event';
import * as mockFactories from 'utils/test/factories';
import { SessionProvider } from 'data/SessionProvider';
import { DashboardTest } from 'components/Dashboard/DashboardTest';
import { DashboardPaths } from 'utils/routers/dashboard';
import { expectFetchCall } from 'utils/test/expectFetchCall';
import { expectBreadcrumbsToEqualParts } from 'utils/test/expectBreadcrumbsToEqualParts';
import JoanieSessionProvider from 'data/SessionProvider/JoanieSessionProvider';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockFactories
    .ContextFactory({
      authentication: { backend: 'fonzie', endpoint: 'https://demo.endpoint' },
      joanie_backend: { endpoint: 'https://joanie.endpoint' },
    })
    .generate(),
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
    const address = mockFactories.AddressFactory.generate();
    const addressUpdated = mockFactories.AddressFactory.generate();
    // It must keep the same id.
    addressUpdated.id = address.id;
    fetchMock.get('https://joanie.endpoint/api/v1.0/addresses/', [address]);
    const updateUrl = 'https://joanie.endpoint/api/v1.0/addresses/' + address.id + '/';
    fetchMock.put(updateUrl, 200);

    render(
      <QueryClientProvider client={createTestQueryClient({ user: true })}>
        <IntlProvider locale="en">
          <SessionProvider>
            <DashboardTest
              initialRoute={DashboardPaths.PREFERENCES_ADDRESS_EDITION.replace(
                ':addressId',
                address.id,
              )}
            />
          </SessionProvider>
        </IntlProvider>
      </QueryClientProvider>,
    );

    // It doesn't show any errors.
    expect(screen.queryByText('An error occurred', { exact: false })).toBeNull();
    await expectBreadcrumbsToEqualParts([
      'Back',
      'My preferences',
      'Edit address "' + address.title + '"',
    ]);

    // The form fields are correctly set to the `address` ones.
    const button = await screen.findByRole('button', { name: 'Save updates' });
    const titleInput: HTMLInputElement = screen.getByRole('textbox', { name: 'Address title' });
    const firstnameInput: HTMLInputElement = screen.getByRole('textbox', {
      name: "Recipient's first name",
    });
    const lastnameInput: HTMLInputElement = screen.getByRole('textbox', {
      name: "Recipient's last name",
    });
    const addressInput: HTMLInputElement = screen.getByRole('textbox', { name: 'Address' });
    const cityInput: HTMLInputElement = screen.getByRole('textbox', { name: 'City' });
    const postcodeInput: HTMLInputElement = screen.getByRole('textbox', { name: 'Postcode' });
    const countryInput: HTMLSelectElement = screen.getByRole('combobox', { name: 'Country' });

    await waitFor(() => expect(titleInput.value).toBe(address.title));
    expect(firstnameInput.value).toBe(address.first_name);
    expect(lastnameInput.value).toBe(address.last_name);
    expect(addressInput.value).toBe(address.address);
    expect(cityInput.value).toBe(address.city);
    expect(postcodeInput.value).toBe(address.postcode);
    expect(countryInput.value).toBe(address.country);

    // Mock refresh route.
    fetchMock.get('https://joanie.endpoint/api/v1.0/addresses/', [addressUpdated], {
      overwriteRoutes: true,
    });

    // Submit of the form calls the API edit route.
    expect(fetchMock.called(updateUrl, { method: 'put' })).toBe(false);

    // it is not necessary to update all fields as it is mocked above.
    await userEvent.clear(titleInput);
    await userEvent.type(titleInput, addressUpdated.title);
    await userEvent.click(button);
    expect(fetchMock.called(updateUrl, { method: 'put' })).toBe(true);

    // The API is called with correct body.
    const expectedBody = { ...address, title: addressUpdated.title };
    delete expectedBody.id;
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
    const address = mockFactories.AddressFactory.generate();
    fetchMock.get('https://joanie.endpoint/api/v1.0/addresses/', [address]);

    // Mock the edit API route to return a 500 status.
    const updateUrl = `https://joanie.endpoint/api/v1.0/addresses/${address.id}/`;
    fetchMock.put(updateUrl, { status: 500, body: 'Bad request' });

    const { container } = render(
      <QueryClientProvider client={createTestQueryClient({ user: true })}>
        <IntlProvider locale="en">
          <JoanieSessionProvider>
            <DashboardTest
              initialRoute={DashboardPaths.PREFERENCES_ADDRESS_EDITION.replace(
                ':addressId',
                address.id,
              )}
            />
          </JoanieSessionProvider>
        </IntlProvider>
      </QueryClientProvider>,
    );

    await expectBreadcrumbsToEqualParts([
      'Back',
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

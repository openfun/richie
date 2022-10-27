import { hydrate, QueryClientProvider } from 'react-query';
import fetchMock from 'fetch-mock';
import { act } from '@testing-library/react-hooks';
import { findByText, fireEvent, render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import * as mockFactories from 'utils/test/factories';
import createQueryClient from 'utils/react-query/createQueryClient';
import { SessionProvider } from 'data/SessionProvider';
import { DashboardTest } from 'components/Dashboard/DashboardTest';
import { DashboardPaths } from 'utils/routers/dashboard';
import { Address } from 'types/Joanie';
import { expectFetchCall } from 'utils/test/expectFetchCall';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockFactories
    .ContextFactory({
      authentication: { backend: 'fonzie', endpoint: 'https://demo.endpoint' },
      joanie_backend: { endpoint: 'https://joanie.endpoint' },
    })
    .generate(),
}));

jest.mock('utils/indirection/window', () => ({
  confirm: jest.fn(() => true),
}));

/**
 * Fills the form with `address` data.
 * @param address
 */
const fillForm = async (address: Address) => {
  const titleInput = screen.getByRole('textbox', { name: 'Address title' });
  const firstnameInput = screen.getByRole('textbox', { name: "Recipient's first name" });
  const lastnameInput = screen.getByRole('textbox', { name: "Recipient's last name" });
  const addressInput = screen.getByRole('textbox', { name: 'Address' });
  const cityInput = screen.getByRole('textbox', { name: 'City' });
  const postcodeInput = screen.getByRole('textbox', { name: 'Postcode' });
  const countryInput = screen.getByRole('combobox', { name: 'Country' });

  await act(async () => {
    fireEvent.input(titleInput, { target: { value: address?.title } });
    fireEvent.change(firstnameInput, { target: { value: address?.first_name } });
    fireEvent.change(lastnameInput, { target: { value: address?.last_name } });
    fireEvent.change(addressInput, { target: { value: address?.address } });
    fireEvent.change(cityInput, { target: { value: address?.city } });
    fireEvent.change(postcodeInput, { target: { value: address?.postcode } });
    fireEvent.change(countryInput, { target: { value: address?.country } });
  });
};

describe('<DashboardCreateAddress/>', () => {
  const createQueryClientWithUser = (isAuthenticated: Boolean) => {
    const user = isAuthenticated ? mockFactories.UserFactory.generate() : null;
    const { clientState } = mockFactories.PersistedClientFactory({
      queries: [mockFactories.QueryStateFactory('user', { data: user })],
    });
    const client = createQueryClient();
    hydrate(client, clientState);

    return client;
  };

  beforeEach(() => {
    fetchMock.get('https://joanie.endpoint/api/orders/', []);
    fetchMock.get('https://joanie.endpoint/api/credit-cards/', []);
  });

  afterEach(() => {
    jest.clearAllMocks();
    fetchMock.restore();
  });

  it('renders error for each field', async () => {
    fetchMock.get('https://joanie.endpoint/api/addresses/', []);
    const client = createQueryClientWithUser(true);
    await act(async () => {
      render(
        <QueryClientProvider client={client}>
          <IntlProvider locale="en">
            <SessionProvider>
              <DashboardTest initialRoute={DashboardPaths.PREFERENCES_ADDRESS_CREATION} />
            </SessionProvider>
          </IntlProvider>
        </QueryClientProvider>,
      );
    });

    // We are on the expected route.
    await screen.findByText('Create an address');
    // It doesn't show any errors.
    expect(screen.queryByText('An error occurred', { exact: false })).toBeNull();

    // Submit the empty form to trigger validation errors.
    const button = await screen.findByRole('button', { name: 'Create' });
    await act(async () => {
      fireEvent.click(button);
    });

    const titleInput = screen.getByRole('textbox', { name: 'Address title' });
    const firstnameInput = screen.getByRole('textbox', { name: "Recipient's first name" });
    const lastnameInput = screen.getByRole('textbox', { name: "Recipient's last name" });
    const addressInput = screen.getByRole('textbox', { name: 'Address' });
    const cityInput = screen.getByRole('textbox', { name: 'City' });
    const postcodeInput = screen.getByRole('textbox', { name: 'Postcode' });
    const countryInput = screen.getByRole('combobox', { name: 'Country' });

    await findByText(titleInput.closest('.form-field')!, 'This field is required.');
    await findByText(firstnameInput.closest('.form-field')!, 'This field is required.');
    await findByText(lastnameInput.closest('.form-field')!, 'This field is required.');
    await findByText(addressInput.closest('.form-field')!, 'This field is required.');
    await findByText(cityInput.closest('.form-field')!, 'This field is required.');
    await findByText(postcodeInput.closest('.form-field')!, 'This field is required.');
    await findByText(countryInput.closest('.form-field')!, 'You must select a value.');

    // The create API route is not called.
    expect(fetchMock.called('https://joanie.endpoint/api/addresses/', { method: 'post' })).toBe(
      false,
    );

    // Make sure it stays on the same route.
    await screen.findByText('Create an address');
  });

  it('creates an address and redirect to preferences', async () => {
    fetchMock.get('https://joanie.endpoint/api/addresses/', []);
    fetchMock.post('https://joanie.endpoint/api/addresses/', []);
    const client = createQueryClientWithUser(true);
    await act(async () => {
      render(
        <QueryClientProvider client={client}>
          <IntlProvider locale="en">
            <SessionProvider>
              <DashboardTest initialRoute={DashboardPaths.PREFERENCES_ADDRESS_CREATION} />
            </SessionProvider>
          </IntlProvider>
        </QueryClientProvider>,
      );
    });
    // We are on the expected route.
    await screen.findByText('Create an address');

    // Fill the form with random data.
    const button = await screen.findByRole('button', { name: 'Create' });
    const address = mockFactories.AddressFactory.generate();
    await fillForm(address);

    // Form submit calls the API create route.
    expect(fetchMock.called('https://joanie.endpoint/api/addresses/', { method: 'post' })).toBe(
      false,
    );
    await act(async () => {
      fireEvent.click(button);
    });
    expect(fetchMock.called('https://joanie.endpoint/api/addresses/', { method: 'post' })).toBe(
      true,
    );

    // The API is called with correct body.
    const expectedBody = { ...address, is_main: true };
    delete expectedBody.id;
    expectFetchCall(
      'https://joanie.endpoint/api/addresses/',
      { method: 'post' },
      {
        body: expectedBody,
      },
    );

    // It is redirected to the addresses list.
    await screen.findByText('Billing addresses');
  });

  it('shows an error in case of API error', async () => {
    fetchMock.get('https://joanie.endpoint/api/addresses/', []);

    // Mock the create API route to return a 500 status.
    fetchMock.post('https://joanie.endpoint/api/addresses/', {
      status: 500,
      body: 'Bad request',
    });
    const client = createQueryClientWithUser(true);

    let container: HTMLElement | undefined;
    await act(async () => {
      container = render(
        <QueryClientProvider client={client}>
          <IntlProvider locale="en">
            <SessionProvider>
              <DashboardTest initialRoute={DashboardPaths.PREFERENCES_ADDRESS_CREATION} />
            </SessionProvider>
          </IntlProvider>
        </QueryClientProvider>,
      ).container;
    });

    // We are on the expected route.
    await screen.findByText('Create an address');

    // Fill the form with random data.
    const button = await screen.findByRole('button', { name: 'Create' });
    const address = mockFactories.AddressFactory.generate();
    await fillForm(address);

    // The create API route is called when submitting form.
    expect(fetchMock.called('https://joanie.endpoint/api/addresses/', { method: 'post' })).toBe(
      false,
    );
    await act(async () => {
      fireEvent.click(button);
    });
    expect(fetchMock.called('https://joanie.endpoint/api/addresses/', { method: 'post' })).toBe(
      true,
    );

    // It shows an error banner.
    const banner = container!.querySelector('.banner--error') as HTMLElement;
    expect(banner).not.toBeNull();
    await findByText(banner!, 'An error occurred while creating the address. Please retry later.');
  });
});

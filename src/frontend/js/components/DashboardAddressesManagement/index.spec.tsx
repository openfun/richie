import {
  fireEvent,
  getByRole,
  queryByRole,
  queryByText,
  render,
  screen,
} from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { hydrate, QueryClientProvider } from 'react-query';
import { act } from '@testing-library/react-hooks';
import fetchMock from 'fetch-mock';
import { findByText } from '@storybook/testing-library';
import * as mockFactories from 'utils/test/factories';
import { SessionProvider } from 'data/SessionProvider';
import createQueryClient from 'utils/react-query/createQueryClient';
import { DashboardTest } from 'components/Dashboard/DashboardTest';
import { DashboardPaths } from 'utils/routers/dashboard';
import * as Joanie from 'types/Joanie';

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

describe('<DashAddressesManagement/>', () => {
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

  it('renders an empty list with placeholder', async () => {
    fetchMock.get('https://joanie.endpoint/api/addresses/', []);
    const client = createQueryClientWithUser(true);
    await act(async () => {
      render(
        <QueryClientProvider client={client}>
          <IntlProvider locale="en">
            <SessionProvider>
              <DashboardTest initialRoute={DashboardPaths.PREFERENCES} />
            </SessionProvider>
          </IntlProvider>
        </QueryClientProvider>,
      );
    });
    // No error is shown.
    expect(screen.queryByText('An error occurred', { exact: false })).toBeNull();
    // The empty placeholder is shown.
    screen.getByText("You haven't created any addresses yet.");
  });

  it('renders a list with addresses', async () => {
    const client = createQueryClientWithUser(true);
    const addresses = mockFactories.AddressFactory.generate(5);
    fetchMock.get('https://joanie.endpoint/api/addresses/', addresses);
    await act(async () => {
      render(
        <QueryClientProvider client={client}>
          <IntlProvider locale="en">
            <SessionProvider>
              <DashboardTest initialRoute={DashboardPaths.PREFERENCES} />
            </SessionProvider>
          </IntlProvider>
        </QueryClientProvider>,
      );
    });

    // No error is shown.
    expect(screen.queryByText('An error occurred', { exact: false })).toBeNull();
    // Each addresses is displayed.
    addresses.forEach((address: Joanie.Address) => {
      screen.getByText(address.title);
    });
  });

  it('deletes an address', async () => {
    const client = createQueryClientWithUser(true);
    const addresses = mockFactories.AddressFactory.generate(5);
    fetchMock.get('https://joanie.endpoint/api/addresses/', addresses);
    await act(async () => {
      render(
        <QueryClientProvider client={client}>
          <IntlProvider locale="en">
            <SessionProvider>
              <DashboardTest initialRoute={DashboardPaths.PREFERENCES} />
            </SessionProvider>
          </IntlProvider>
        </QueryClientProvider>,
      );
    });
    // No error is shown.
    expect(screen.queryByText('An error occurred', { exact: false })).toBeNull();

    // Find the delete button of the first address.
    const address = addresses[0];
    screen.getByText(address.title);
    const addressBox = await screen.findByTestId('dashboard-address-box__' + address.id);
    const deleteButton = getByRole(addressBox, 'button', {
      name: 'Delete',
    });

    // Mock the delete route and the refresh route to returns `addresses` without the first one.
    const deleteUrl = 'https://joanie.endpoint/api/addresses/' + address.id + '/';
    fetchMock.delete(deleteUrl, []);
    fetchMock.get('https://joanie.endpoint/api/addresses/', addresses.splice(1), {
      overwriteRoutes: true,
    });

    // Clicking on the delete button calls the delete API route.
    expect(fetchMock.called(deleteUrl)).toBe(false);
    await act(async () => {
      fireEvent.click(deleteButton);
    });
    expect(fetchMock.called(deleteUrl)).toBe(true);

    // The address does not appear anymore in the list.
    expect(screen.queryByText(address.title)).toBeNull();

    // No error is shown.
    expect(screen.queryByText('An error occurred', { exact: false })).toBeNull();
  });

  it('promotes an address', async () => {
    const client = createQueryClientWithUser(true);
    const addresses = mockFactories.AddressFactory.generate(5);
    fetchMock.get('https://joanie.endpoint/api/addresses/', addresses);
    await act(async () => {
      render(
        <QueryClientProvider client={client}>
          <IntlProvider locale="en">
            <SessionProvider>
              <DashboardTest initialRoute={DashboardPaths.PREFERENCES} />
            </SessionProvider>
          </IntlProvider>
        </QueryClientProvider>,
      );
    });
    // No error is shown.
    expect(screen.queryByText('An error occurred', { exact: false })).toBeNull();

    // Find the promote button of the first address.
    const address = addresses[0];
    screen.getByText(address.title);
    let addressBox = screen.getByTestId('dashboard-address-box__' + address.id);
    const promoteButton = getByRole(addressBox, 'button', {
      name: 'Use by default',
    });
    // The address is not already the main one.
    expect(queryByText(addressBox, 'Default address')).toBeNull();

    // Mock the update url and the refresh URL to return the first address as main.
    const updateUrl = 'https://joanie.endpoint/api/addresses/' + address.id + '/';
    fetchMock.put(updateUrl, []);
    fetchMock.get(
      'https://joanie.endpoint/api/addresses/',
      [{ ...address, is_main: true }, ...addresses.splice(1)],
      { overwriteRoutes: true },
    );

    // Clicking on the promote button calls the update API route.
    expect(fetchMock.called(updateUrl)).toBe(false);
    await act(async () => {
      fireEvent.click(promoteButton);
    });
    expect(fetchMock.called(updateUrl)).toBe(true);

    // Assert that "Default Address" is displayed on the address's box.
    addressBox = screen.getByTestId('dashboard-address-box__' + address.id);
    await findByText(addressBox, 'Default address');

    // No error is shown.
    expect(screen.queryByText('An error occurred', { exact: false })).toBeNull();
  });

  it('shows the main address above all others', async () => {
    const client = createQueryClientWithUser(true);
    const addresses = mockFactories.AddressFactory.generate(5);
    addresses[0].is_main = true;
    fetchMock.get('https://joanie.endpoint/api/addresses/', addresses);
    await act(async () => {
      render(
        <QueryClientProvider client={client}>
          <IntlProvider locale="en">
            <SessionProvider>
              <DashboardTest initialRoute={DashboardPaths.PREFERENCES} />
            </SessionProvider>
          </IntlProvider>
        </QueryClientProvider>,
      );
    });

    const addressBoxes = screen.queryAllByTestId('dashboard-address-box__', { exact: false });
    expect(addressBoxes.length).toEqual(5);
    await findByText(addressBoxes[0], 'Default address');
    addressBoxes
      .splice(1)
      .forEach((addressBox) => expect(queryByText(addressBox, 'Default address')).toBeNull());
  });

  it('cannot delete a main address', async () => {
    const client = createQueryClientWithUser(true);
    const addresses = mockFactories.AddressFactory.generate(5);
    addresses[0].is_main = true;
    fetchMock.get('https://joanie.endpoint/api/addresses/', addresses);
    await act(async () => {
      render(
        <QueryClientProvider client={client}>
          <IntlProvider locale="en">
            <SessionProvider>
              <DashboardTest initialRoute={DashboardPaths.PREFERENCES} />
            </SessionProvider>
          </IntlProvider>
        </QueryClientProvider>,
      );
    });

    // Assert that no delete button is shown on the main address.
    const address = addresses[0];
    screen.getByText(address.title);
    const addressBox = screen.getByTestId('dashboard-address-box__' + address.id);
    expect(
      queryByRole(addressBox, 'button', {
        name: 'Delete',
      }),
    ).toBeNull();
  });

  it('cannot promote a main address', async () => {
    const client = createQueryClientWithUser(true);
    const addresses = mockFactories.AddressFactory.generate(5);
    addresses[0].is_main = true;
    fetchMock.get('https://joanie.endpoint/api/addresses/', addresses);
    await act(async () => {
      render(
        <QueryClientProvider client={client}>
          <IntlProvider locale="en">
            <SessionProvider>
              <DashboardTest initialRoute={DashboardPaths.PREFERENCES} />
            </SessionProvider>
          </IntlProvider>
        </QueryClientProvider>,
      );
    });

    // Assert that no promote button is shown on the main address.
    const address = addresses[0];
    screen.getByText(address.title);
    const addressBox = screen.getByTestId('dashboard-address-box__' + address.id);
    expect(
      queryByRole(addressBox, 'button', {
        name: 'Use by default',
      }),
    ).toBeNull();
  });

  it('redirects to the create address route', async () => {
    const client = createQueryClientWithUser(true);
    fetchMock.get('https://joanie.endpoint/api/addresses/', []);
    await act(async () => {
      render(
        <QueryClientProvider client={client}>
          <IntlProvider locale="en">
            <SessionProvider>
              <DashboardTest initialRoute={DashboardPaths.PREFERENCES} />
            </SessionProvider>
          </IntlProvider>
        </QueryClientProvider>,
      );
    });
    // Clicking on the create button redirects to the create route.
    const button = await screen.findByRole('button', { name: 'Add a new address' });
    await act(async () => {
      fireEvent.click(button);
    });
    // Make sure it redirected to the correct route.
    await screen.findByText('Create an address');
  });

  it('redirects to the edit address route', async () => {
    const client = createQueryClientWithUser(true);
    const address = mockFactories.AddressFactory.generate();
    fetchMock.get('https://joanie.endpoint/api/addresses/', [address]);
    await act(async () => {
      render(
        <QueryClientProvider client={client}>
          <IntlProvider locale="en">
            <SessionProvider>
              <DashboardTest initialRoute={DashboardPaths.PREFERENCES} />
            </SessionProvider>
          </IntlProvider>
        </QueryClientProvider>,
      );
    });

    // Clicking on the edit button of a given address redirects to its edit route.
    const button = await screen.findByRole('button', { name: 'Edit' });
    await act(async () => {
      fireEvent.click(button);
    });

    // Make sure it redirected to the correct route.
    await screen.findByText('Edit address "' + address.title + '"');
  });

  it('shows an error banner in case of API error', async () => {
    const client = createQueryClientWithUser(true);
    mockFactories.AddressFactory.generate();
    // Mock the API route to return a 500 error.
    fetchMock.get('https://joanie.endpoint/api/addresses/', {
      status: 500,
      body: 'Bad request',
    });
    let container: HTMLElement | undefined;
    await act(async () => {
      container = render(
        <QueryClientProvider client={client}>
          <IntlProvider locale="en">
            <SessionProvider>
              <DashboardTest initialRoute={DashboardPaths.PREFERENCES} />
            </SessionProvider>
          </IntlProvider>
        </QueryClientProvider>,
      ).container;
    });

    // It shows an error banner.
    const banner = container!.querySelector('.banner--error') as HTMLElement;
    expect(banner).not.toBeNull();
    await findByText(banner!, 'An error occurred: Internal Server Error. Please retry later.');
  });
});

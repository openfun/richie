import {
  act,
  fireEvent,
  getByRole,
  queryByRole,
  queryByText,
  render,
  screen,
} from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { QueryClientProvider } from '@tanstack/react-query';
import fetchMock from 'fetch-mock';
import { findByText } from '@storybook/testing-library';
import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import { AddressFactory } from 'utils/test/factories/joanie';
import { SessionProvider } from 'contexts/SessionContext';
import { DashboardTest } from 'widgets/Dashboard/components/DashboardTest';
import { LearnerDashboardPaths } from 'widgets/Dashboard/utils/learnerRouteMessages';
import * as Joanie from 'types/Joanie';
import { expectBreadcrumbsToEqualParts } from 'utils/test/expectBreadcrumbsToEqualParts';
import { resolveAll } from 'utils/resolveAll';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import { expectBannerError } from 'utils/test/expectBanner';

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

describe('<DashAddressesManagement/>', () => {
  beforeEach(() => {
    fetchMock.get('https://joanie.endpoint/api/v1.0/orders/', []);
    fetchMock.get('https://joanie.endpoint/api/v1.0/credit-cards/', []);
  });

  afterEach(() => {
    jest.clearAllMocks();
    fetchMock.restore();
  });

  it('renders an empty list with placeholder', async () => {
    fetchMock.get('https://joanie.endpoint/api/v1.0/addresses/', []);
    await act(async () => {
      render(
        <QueryClientProvider client={createTestQueryClient({ user: true })}>
          <IntlProvider locale="en">
            <SessionProvider>
              <DashboardTest initialRoute={LearnerDashboardPaths.PREFERENCES} />
            </SessionProvider>
          </IntlProvider>
        </QueryClientProvider>,
      );
    });

    expectBreadcrumbsToEqualParts(['Back', 'My preferences']);
    // The empty placeholder is shown.
    await screen.findByText("You haven't created any addresses yet.");
    // No error is shown.
    expect(screen.queryByText('An error occurred', { exact: false })).toBeNull();
  });

  it('renders a list with addresses', async () => {
    const addresses = AddressFactory().many(5);
    fetchMock.get('https://joanie.endpoint/api/v1.0/addresses/', addresses);
    await act(async () => {
      render(
        <QueryClientProvider client={createTestQueryClient({ user: true })}>
          <IntlProvider locale="en">
            <SessionProvider>
              <DashboardTest initialRoute={LearnerDashboardPaths.PREFERENCES} />
            </SessionProvider>
          </IntlProvider>
        </QueryClientProvider>,
      );
    });

    // No error is shown.
    expect(screen.queryByText('An error occurred', { exact: false })).toBeNull();
    // Each addresses is displayed.
    await resolveAll(addresses, async (address: Joanie.Address) => {
      await screen.findByText(address.title);
    });
  });

  it('deletes an address', async () => {
    const addresses = AddressFactory().many(5);
    fetchMock.get('https://joanie.endpoint/api/v1.0/addresses/', addresses);
    await act(async () => {
      render(
        <QueryClientProvider client={createTestQueryClient({ user: true })}>
          <IntlProvider locale="en">
            <SessionProvider>
              <DashboardTest initialRoute={LearnerDashboardPaths.PREFERENCES} />
            </SessionProvider>
          </IntlProvider>
        </QueryClientProvider>,
      );
    });
    // No error is shown.
    expect(screen.queryByText('An error occurred', { exact: false })).toBeNull();

    // Find the delete button of the first address.
    const address = addresses[0];
    await screen.findByText(address.title);
    const addressBox = await screen.findByTestId('dashboard-address-box__' + address.id);
    const deleteButton = getByRole(addressBox, 'button', {
      name: 'Delete',
    });

    // Mock the delete route and the refresh route to returns `addresses` without the first one.
    const deleteUrl = 'https://joanie.endpoint/api/v1.0/addresses/' + address.id + '/';
    fetchMock.delete(deleteUrl, []);
    fetchMock.get('https://joanie.endpoint/api/v1.0/addresses/', addresses.splice(1), {
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
    const addresses = AddressFactory().many(5);
    fetchMock.get('https://joanie.endpoint/api/v1.0/addresses/', addresses);
    await act(async () => {
      render(
        <QueryClientProvider client={createTestQueryClient({ user: true })}>
          <IntlProvider locale="en">
            <SessionProvider>
              <DashboardTest initialRoute={LearnerDashboardPaths.PREFERENCES} />
            </SessionProvider>
          </IntlProvider>
        </QueryClientProvider>,
      );
    });
    // No error is shown.
    expect(screen.queryByText('An error occurred', { exact: false })).toBeNull();

    // Find the promote button of the first address.
    const address = addresses[0];
    await screen.findByText(address.title);
    let addressBox = screen.getByTestId('dashboard-address-box__' + address.id);
    const promoteButton = getByRole(addressBox, 'button', {
      name: 'Use by default',
    });
    // The address is not already the main one.
    expect(queryByText(addressBox, 'Default address')).toBeNull();

    // Mock the update url and the refresh URL to return the first address as main.
    const updateUrl = 'https://joanie.endpoint/api/v1.0/addresses/' + address.id + '/';
    fetchMock.put(updateUrl, []);
    fetchMock.get(
      'https://joanie.endpoint/api/v1.0/addresses/',
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
    const addresses = AddressFactory().many(5);
    addresses[0].is_main = true;
    fetchMock.get('https://joanie.endpoint/api/v1.0/addresses/', addresses);
    await act(async () => {
      render(
        <QueryClientProvider client={createTestQueryClient({ user: true })}>
          <IntlProvider locale="en">
            <SessionProvider>
              <DashboardTest initialRoute={LearnerDashboardPaths.PREFERENCES} />
            </SessionProvider>
          </IntlProvider>
        </QueryClientProvider>,
      );
    });

    const addressBoxes = await screen.findAllByTestId('dashboard-address-box__', { exact: false });
    expect(addressBoxes.length).toEqual(5);
    await findByText(addressBoxes[0], 'Default address');
    addressBoxes
      .splice(1)
      .forEach((addressBox) => expect(queryByText(addressBox, 'Default address')).toBeNull());
  });

  it('cannot delete a main address', async () => {
    const addresses = AddressFactory().many(5);
    addresses[0].is_main = true;
    fetchMock.get('https://joanie.endpoint/api/v1.0/addresses/', addresses);
    await act(async () => {
      render(
        <QueryClientProvider client={createTestQueryClient({ user: true })}>
          <IntlProvider locale="en">
            <SessionProvider>
              <DashboardTest initialRoute={LearnerDashboardPaths.PREFERENCES} />
            </SessionProvider>
          </IntlProvider>
        </QueryClientProvider>,
      );
    });

    // Assert that no delete button is shown on the main address.
    const address = addresses[0];
    await screen.findByText(address.title);
    const addressBox = screen.getByTestId('dashboard-address-box__' + address.id);
    expect(
      queryByRole(addressBox, 'button', {
        name: 'Delete',
      }),
    ).toBeNull();
  });

  it('cannot promote a main address', async () => {
    const addresses = AddressFactory().many(5);
    addresses[0].is_main = true;
    fetchMock.get('https://joanie.endpoint/api/v1.0/addresses/', addresses);
    await act(async () => {
      render(
        <QueryClientProvider client={createTestQueryClient({ user: true })}>
          <IntlProvider locale="en">
            <SessionProvider>
              <DashboardTest initialRoute={LearnerDashboardPaths.PREFERENCES} />
            </SessionProvider>
          </IntlProvider>
        </QueryClientProvider>,
      );
    });

    // Assert that no promote button is shown on the main address.
    const address = addresses[0];
    await screen.findByText(address.title);
    const addressBox = screen.getByTestId('dashboard-address-box__' + address.id);
    expect(
      queryByRole(addressBox, 'button', {
        name: 'Use by default',
      }),
    ).toBeNull();
  });

  it('redirects to the create address route', async () => {
    fetchMock.get('https://joanie.endpoint/api/v1.0/addresses/', []);
    await act(async () => {
      render(
        <QueryClientProvider client={createTestQueryClient({ user: true })}>
          <IntlProvider locale="en">
            <SessionProvider>
              <DashboardTest initialRoute={LearnerDashboardPaths.PREFERENCES} />
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
    const address = AddressFactory().one();
    fetchMock.get('https://joanie.endpoint/api/v1.0/addresses/', [address]);
    await act(async () => {
      render(
        <QueryClientProvider client={createTestQueryClient({ user: true })}>
          <IntlProvider locale="en">
            <SessionProvider>
              <DashboardTest initialRoute={LearnerDashboardPaths.PREFERENCES} />
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
    await screen.getAllByText('Edit address "' + address.title + '"');
  });

  it('shows an error banner in case of API error', async () => {
    AddressFactory().one();
    // Mock the API route to return a 500 error.
    fetchMock.get('https://joanie.endpoint/api/v1.0/addresses/', {
      status: 500,
      body: 'Bad request',
    });

    await act(async () => {
      render(
        <QueryClientProvider client={createTestQueryClient({ user: true })}>
          <IntlProvider locale="en">
            <SessionProvider>
              <DashboardTest initialRoute={LearnerDashboardPaths.PREFERENCES} />
            </SessionProvider>
          </IntlProvider>
        </QueryClientProvider>,
      );
    });

    await expectBannerError('An error occurred while fetching addresses. Please retry later.');
  });
});

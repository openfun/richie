/**
 * Test suite for AddressesManagement component
 */
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { IntlProvider } from 'react-intl';
import { QueryClientProvider } from '@tanstack/react-query';
import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import { AddressFactory } from 'utils/test/factories/joanie';
import { SessionProvider } from 'contexts/SessionContext';
import type * as Joanie from 'types/Joanie';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import AddressesManagement from '.';

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

describe('AddressesManagement', () => {
  const handleClose = jest.fn();
  const selectAddress = jest.fn();

  beforeEach(() => {
    fetchMock.get('https://joanie.endpoint/api/v1.0/orders/', []);
    fetchMock.get('https://joanie.endpoint/api/v1.0/credit-cards/', []);
  });

  afterEach(() => {
    jest.clearAllMocks();
    fetchMock.restore();
  });

  it('renders a go back button', async () => {
    fetchMock.get('https://joanie.endpoint/api/v1.0/addresses/', []);

    await act(async () => {
      render(
        <QueryClientProvider client={createTestQueryClient({ user: true })}>
          <IntlProvider locale="en">
            <SessionProvider>
              <AddressesManagement handleClose={handleClose} selectAddress={selectAddress} />
            </SessionProvider>
          </IntlProvider>
        </QueryClientProvider>,
      );
    });

    const $closeButton = screen.getByRole('button', { name: 'Go back' });
    expect($closeButton).toBeDefined();

    // - Click on go back button should trigger onClose callback
    expect(handleClose).toHaveBeenCalledTimes(0);
    fireEvent.click($closeButton);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("renders the user's addresses", async () => {
    const addresses = AddressFactory().many(Math.ceil(Math.random() * 5));
    fetchMock.get('https://joanie.endpoint/api/v1.0/addresses/', addresses);

    let container: HTMLElement;

    await act(async () => {
      ({ container } = render(
        <QueryClientProvider client={createTestQueryClient({ user: true })}>
          <IntlProvider locale="en">
            <SessionProvider>
              <AddressesManagement handleClose={handleClose} selectAddress={selectAddress} />
            </SessionProvider>
          </IntlProvider>
        </QueryClientProvider>,
      ));
    });

    await waitFor(() => {
      // All user's addresses should be displayed
      const $addresses = container!.querySelectorAll('.registered-addresses-item');
      return expect($addresses).toHaveLength(addresses.length);
    });

    addresses.forEach((address: Joanie.Address) => {
      const $address = screen.getByTestId(`address-${address.id}-title`);
      expect($address.textContent).toEqual(address.title);
    });

    // - User selects one of its existing address
    const address = addresses[0];
    const $selectButton = screen.getByRole('button', {
      name: `Select "${address.title}" address`,
    });
    await act(async () => {
      fireEvent.click($selectButton);
    });
    expect(selectAddress).toHaveBeenNthCalledWith(1, address);
  });

  it('renders a form to create an address', async () => {
    fetchMock.get('https://joanie.endpoint/api/v1.0/addresses/', []);

    await act(async () => {
      render(
        <QueryClientProvider client={createTestQueryClient({ user: true })}>
          <IntlProvider locale="en">
            <SessionProvider>
              <AddressesManagement handleClose={handleClose} selectAddress={selectAddress} />
            </SessionProvider>
          </IntlProvider>
        </QueryClientProvider>,
      );
    });

    screen.getByRole('heading', { level: 2, name: 'Add a new address' });
    screen.getByRole('form');
    const $titleField = screen.getByRole('textbox', { name: 'Address title' });
    const $firstnameField = screen.getByRole('textbox', { name: "Recipient's first name" });
    const $lastnameField = screen.getByRole('textbox', { name: "Recipient's last name" });
    const $addressField = screen.getByRole('textbox', { name: 'Address' });
    const $cityField = screen.getByRole('textbox', { name: 'City' });
    const $postcodeField = screen.getByRole('textbox', { name: 'Postcode' });
    const $countryField = screen.getByRole('combobox', { name: 'Country' });
    const $saveField = screen.getByRole('checkbox', { name: 'Save this address' });
    const $submitButton = screen.getByRole('button', {
      name: 'Use this address',
    }) as HTMLButtonElement;

    // - submit button should always be enabled to allow early user feedback
    expect($submitButton.disabled).toBe(false);

    // - User fulfills address fields
    let address = AddressFactory().one();
    expect(selectAddress).not.toHaveBeenCalled();
    await act(async () => {
      fireEvent.input($titleField, { target: { value: address.title } });
      fireEvent.change($firstnameField, { target: { value: address.first_name } });
      fireEvent.change($lastnameField, { target: { value: address.last_name } });
      fireEvent.change($addressField, { target: { value: address.address } });
      fireEvent.change($cityField, { target: { value: address.city } });
      fireEvent.change($postcodeField, { target: { value: address.postcode } });
      fireEvent.change($countryField, { target: { value: address.country } });
      // - As form validation is triggered on blur, we need to trigger this event in
      //   order to update form state.
      fireEvent.blur($countryField);
    });

    // Once the form has been fulfilled properly, submit button should still be enabled.
    expect($submitButton.disabled).toBe(false);

    await act(async () => {
      fireEvent.click($submitButton);
    });

    expect(selectAddress).toHaveBeenNthCalledWith(1, {
      ...address,
      id: 'local-billing-address',
      is_main: false,
    });

    // - User fulfills the form again but wants to save the address this time
    address = AddressFactory().one();
    fetchMock.post('https://joanie.endpoint/api/v1.0/addresses/', {
      ...address,
      is_main: true,
    });
    await act(async () => {
      fireEvent.change($titleField, { target: { value: address.title } });
      fireEvent.change($firstnameField, { target: { value: address.first_name } });
      fireEvent.change($lastnameField, { target: { value: address.last_name } });
      fireEvent.change($addressField, { target: { value: address.address } });
      fireEvent.change($cityField, { target: { value: address.city } });
      fireEvent.change($postcodeField, { target: { value: address.postcode } });
      fireEvent.change($countryField, { target: { value: address.country } });
      fireEvent.click($saveField);
      fireEvent.click($submitButton);
    });

    expect(selectAddress).toHaveBeenNthCalledWith(2, {
      ...address,
      is_main: true,
    });
  });

  it('renders a form to edit an address when user selects an address to edit', async () => {
    const address = AddressFactory().one();
    fetchMock.get('https://joanie.endpoint/api/v1.0/addresses/', [address]);

    await act(async () => {
      render(
        <QueryClientProvider client={createTestQueryClient({ user: true })}>
          <IntlProvider locale="en">
            <SessionProvider>
              <AddressesManagement handleClose={handleClose} selectAddress={selectAddress} />
            </SessionProvider>
          </IntlProvider>
        </QueryClientProvider>,
      );
    });

    // - First the creation form should be displayed
    screen.getByRole('heading', { level: 2, name: 'Add a new address' });
    screen.getByRole('form');
    screen.getByRole('checkbox', { name: 'Save this address' });
    screen.getByRole('button', { name: 'Use this address' });

    // - Then user selects an address to edit
    let $editButton = await screen.findByRole('button', {
      name: `Edit "${address.title}" address`,
    });
    await act(async () => {
      fireEvent.click($editButton);
    });

    // - Form should be updated
    screen.getByRole('heading', { level: 2, name: `Update address ${address.title}` });

    let $titleField = screen.getByRole('textbox', { name: 'Address title' }) as HTMLInputElement;
    let $firstnameField = screen.getByRole('textbox', {
      name: "Recipient's first name",
    }) as HTMLInputElement;
    let $lastnameField = screen.getByRole('textbox', {
      name: "Recipient's last name",
    }) as HTMLInputElement;
    let $addressField = screen.queryByRole('textbox', { name: 'Address' }) as HTMLInputElement;
    let $cityField = screen.queryByRole('textbox', { name: 'City' }) as HTMLInputElement;
    let $postcodeField = screen.queryByRole('textbox', { name: 'Postcode' }) as HTMLInputElement;
    let $countryField = screen.queryByRole('combobox', { name: 'Country' }) as HTMLSelectElement;
    let $saveField = screen.queryByRole('checkbox', { name: 'Save this address' });
    let $submitButton = screen.getByRole('button', { name: 'Update this address' });

    expect($titleField.value).toEqual(address.title);
    expect($firstnameField.value).toEqual(address.first_name);
    expect($lastnameField.value).toEqual(address.last_name);
    expect($addressField.value).toEqual(address.address);
    expect($cityField.value).toEqual(address.city);
    expect($postcodeField.value).toEqual(address.postcode);
    expect($countryField.value).toEqual(address.country);
    expect($saveField).toBeNull();

    // focus should be set to the first input as a way to notify screen reader users
    expect(document.activeElement).toEqual($titleField);

    // - User edits some values then submits its changes
    fetchMock
      .put(`https://joanie.endpoint/api/v1.0/addresses/${address.id}/`, {
        ...address,
        title: 'Home',
        first_name: 'John',
        last_name: 'DOE',
      })
      .get(
        'https://joanie.endpoint/api/v1.0/addresses/',
        [
          {
            ...address,
            title: 'Home',
            first_name: 'John',
            last_name: 'DOE',
          },
        ],
        { overwriteRoutes: true },
      );

    await act(async () => {
      fireEvent.change($titleField, 'Home');
      fireEvent.change($firstnameField, 'John');
      fireEvent.change($lastnameField, 'DOE');
      fireEvent.click($submitButton);
    });

    // - Form should be restored and addresses should be updated
    screen.getByRole('heading', { level: 2, name: 'Add a new address' });
    screen.getByRole('form');
    screen.getByRole('checkbox', { name: 'Save this address' });
    screen.getByRole('button', { name: 'Use this address' });
    screen.getByText('Home');

    // User clicks on edit button again
    $editButton = screen.getByRole('button', { name: 'Edit "Home" address' });
    await act(async () => {
      fireEvent.click($editButton);
    });

    // - Form should be updated
    screen.getByRole('heading', { level: 2, name: `Update address Home` });

    $titleField = screen.getByRole('textbox', { name: 'Address title' }) as HTMLInputElement;
    $firstnameField = screen.getByRole('textbox', {
      name: "Recipient's first name",
    }) as HTMLInputElement;
    $lastnameField = screen.getByRole('textbox', {
      name: "Recipient's last name",
    }) as HTMLInputElement;
    $addressField = screen.queryByRole('textbox', { name: 'Address' }) as HTMLInputElement;
    $cityField = screen.queryByRole('textbox', { name: 'City' }) as HTMLInputElement;
    $postcodeField = screen.queryByRole('textbox', { name: 'Postcode' }) as HTMLInputElement;
    $countryField = screen.queryByRole('combobox', { name: 'Country' }) as HTMLSelectElement;
    $saveField = screen.queryByRole('checkbox', { name: 'Save this address' });
    $submitButton = screen.getByRole('button', { name: 'Update this address' });

    expect($titleField.value).toEqual('Home');
    expect($firstnameField.value).toEqual('John');
    expect($lastnameField.value).toEqual('DOE');
    expect($addressField.value).toEqual(address.address);
    expect($cityField.value).toEqual(address.city);
    expect($postcodeField.value).toEqual(address.postcode);
    expect($countryField.value).toEqual(address.country);
    expect($saveField).toBeNull();

    // - But finally user cancels his action
    const $cancelButton = screen.getByRole('button', { name: 'Cancel' });
    await act(async () => {
      fireEvent.click($cancelButton);
    });

    // - Form should be restored and addresses should be updated
    screen.getByRole('heading', { level: 2, name: 'Add a new address' });
    screen.getByRole('form');
    screen.getByRole('checkbox', { name: 'Save this address' });
    screen.getByRole('button', { name: 'Use this address' });
  });

  it('allows user to delete an existing address', async () => {
    const address = AddressFactory().one();
    fetchMock.get('https://joanie.endpoint/api/v1.0/addresses/', [address]);

    let container: HTMLElement;
    await act(async () => {
      ({ container } = render(
        <QueryClientProvider client={createTestQueryClient({ user: true })}>
          <IntlProvider locale="en">
            <SessionProvider>
              <AddressesManagement handleClose={handleClose} selectAddress={selectAddress} />
            </SessionProvider>
          </IntlProvider>
        </QueryClientProvider>,
      ));
    });

    // - User deletes his only existing address
    fetchMock
      .delete(`https://joanie.endpoint/api/v1.0/addresses/${address.id}/`, {})
      .get('https://joanie.endpoint/api/v1.0/addresses/', [], { overwriteRoutes: true });

    const $deleteButton = await screen.findByRole('button', {
      name: `Delete "${address.title}" address`,
    });

    await act(async () => {
      fireEvent.click($deleteButton);
    });

    // - As this was the only existing address,
    //   registered addresses section should be hidden

    expect(screen.queryByRole('heading', { level: 2, name: 'Your addresses' })).toBeNull();
    const $addresses = container!.querySelectorAll('.registered-addresses-item');
    expect($addresses).toHaveLength(0);
  });

  it('allows user to promote an address as main', async () => {
    const [address1, address2] = AddressFactory().many(2);
    address1.is_main = true;
    fetchMock.get('https://joanie.endpoint/api/v1.0/addresses/', [address1, address2]);

    await act(async () => {
      render(
        <QueryClientProvider client={createTestQueryClient({ user: true })}>
          <IntlProvider locale="en">
            <SessionProvider>
              <AddressesManagement handleClose={handleClose} selectAddress={selectAddress} />
            </SessionProvider>
          </IntlProvider>
        </QueryClientProvider>,
      );
    });

    // - User promotes address2 as main
    fetchMock
      .put(`https://joanie.endpoint/api/v1.0/addresses/${address2.id}/`, {
        ...address2,
        is_main: true,
      })
      .get(
        'https://joanie.endpoint/api/v1.0/addresses/',
        [
          {
            ...address1,
            is_main: false,
          },
          {
            ...address2,
            is_main: true,
          },
        ],
        {
          overwriteRoutes: true,
        },
      );

    const $promoteButton = await screen.findByRole('radio', {
      name: `Define "${address2.title}" address as main`,
    });

    await act(async () => {
      fireEvent.click($promoteButton);
    });

    expect(
      screen.getByRole('radio', {
        name: `Define "${address1.title}" address as main`,
      }),
    ).not.toBeChecked();
    expect(
      screen.getByRole('radio', {
        name: `Define "${address2.title}" address as main`,
      }),
    ).toBeChecked();
  });
});

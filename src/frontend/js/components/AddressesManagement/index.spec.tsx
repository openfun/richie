/**
 * Test suite for AddressesManagement component
 */
import { render, screen, waitFor, within } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { IntlProvider } from 'react-intl';
import countries from 'i18n-iso-countries';
import { QueryClientProvider } from '@tanstack/react-query';
import { PropsWithChildren } from 'react';
import { CunninghamProvider } from '@openfun/cunningham-react';
import userEvent, { UserEvent } from '@testing-library/user-event';
import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import { AddressFactory } from 'utils/test/factories/joanie';
import { SessionProvider } from 'contexts/SessionContext';
import type * as Joanie from 'types/Joanie';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import { changeSelect } from 'components/Form/test-utils';
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
  const Wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={createTestQueryClient({ user: true })}>
      <IntlProvider locale="en">
        <CunninghamProvider>
          <SessionProvider>{children}</SessionProvider>
        </CunninghamProvider>
      </IntlProvider>
    </QueryClientProvider>
  );
  let user: UserEvent;

  beforeEach(() => {
    fetchMock.get('https://joanie.endpoint/api/v1.0/orders/', []);
    fetchMock.get('https://joanie.endpoint/api/v1.0/credit-cards/', []);
    user = userEvent.setup();
  });

  afterEach(() => {
    jest.clearAllMocks();
    fetchMock.restore();
  });

  it('renders a go back button', async () => {
    fetchMock.get('https://joanie.endpoint/api/v1.0/addresses/', []);
    render(
      <Wrapper>
        <AddressesManagement handleClose={handleClose} selectAddress={selectAddress} />
      </Wrapper>,
    );

    const $closeButton = await screen.findByRole('button', { name: 'Go back' });
    expect($closeButton).toBeInTheDocument();

    // - Click on go back button should trigger onClose callback
    expect(handleClose).toHaveBeenCalledTimes(0);
    await user.click($closeButton);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("renders the user's addresses", async () => {
    const addresses = AddressFactory().many(Math.ceil(Math.random() * 5));
    fetchMock.get('https://joanie.endpoint/api/v1.0/addresses/', addresses);

    const { container } = render(
      <Wrapper>
        <AddressesManagement handleClose={handleClose} selectAddress={selectAddress} />
      </Wrapper>,
    );

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
    await user.click(
      screen.getByRole('button', {
        name: `Select "${address.title}" address`,
      }),
    );

    expect(selectAddress).toHaveBeenNthCalledWith(1, address);
  });

  it('renders a form to create an address', async () => {
    fetchMock.get('https://joanie.endpoint/api/v1.0/addresses/', []);

    render(
      <Wrapper>
        <AddressesManagement handleClose={handleClose} selectAddress={selectAddress} />
      </Wrapper>,
    );

    expect(
      await screen.findByRole('heading', { level: 2, name: 'Add a new address' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('form')).toBeInTheDocument();

    const $titleField = screen.getByRole('textbox', { name: 'Address title' });
    const $firstnameField = screen.getByRole('textbox', { name: "Recipient's first name" });
    const $lastnameField = screen.getByRole('textbox', { name: "Recipient's last name" });
    const $addressField = screen.getByRole('textbox', { name: 'Address' });
    const $cityField = screen.getByRole('textbox', { name: 'City' });
    const $postcodeField = screen.getByRole('textbox', { name: 'Postcode' });
    const $countryField = screen.getByRole('combobox', { name: 'Country' });
    const $saveField = screen.getByRole('checkbox', { name: /Save this address/ });
    const $submitButton = screen.getByRole('button', {
      name: 'Use this address',
    }) as HTMLButtonElement;

    // - submit button should always be enabled to allow early user feedback
    expect($submitButton.disabled).toBe(false);

    // - User fulfills address fields
    let address = AddressFactory().one();
    expect(selectAddress).not.toHaveBeenCalled();

    await user.type($titleField, address.title);
    await user.type($firstnameField, address.first_name);
    await user.type($lastnameField, address.last_name);
    await user.type($addressField, address.address);
    await user.type($cityField, address.city);
    await user.type($postcodeField, address.postcode);
    await changeSelect($countryField, countries.getName(address?.country, 'en')!, user);

    // Once the form has been fulfilled properly, submit button should still be enabled.
    expect($submitButton.disabled).toBe(false);

    await user.click($submitButton);

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

    await user.type($titleField, address.title);
    await user.type($firstnameField, address.first_name);
    await user.type($lastnameField, address.last_name);
    await user.type($addressField, address.address);
    await user.type($cityField, address.city);
    await user.type($postcodeField, address.postcode);
    await user.click($saveField);
    await changeSelect($countryField, countries.getName(address?.country, 'en')!, user);

    await user.click($submitButton);

    expect(selectAddress).toHaveBeenNthCalledWith(2, {
      ...address,
      is_main: true,
    });
  }, 10000);

  it('renders a form to edit an address when user selects an address to edit', async () => {
    const address = AddressFactory().one();
    fetchMock.get('https://joanie.endpoint/api/v1.0/addresses/', [address]);

    render(
      <Wrapper>
        <AddressesManagement handleClose={handleClose} selectAddress={selectAddress} />
      </Wrapper>,
    );
    await waitFor(() => {
      expect(fetchMock.calls().map((call) => call[0])).toContain(
        'https://joanie.endpoint/api/v1.0/addresses/',
      );
    });

    // - First the creation form should be displayed
    expect(
      screen.getByRole('heading', { level: 2, name: 'Add a new address' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('form')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /Save this address/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Use this address' })).toBeInTheDocument();

    // - Then user selects an address to edit
    const $editButton = await screen.findByRole('button', {
      name: `Edit "${address.title}" address`,
    });
    await user.click($editButton);

    // - Form should be updated
    screen.getByRole('heading', { level: 2, name: `Update address ${address.title}` });

    const $titleField = screen.getByRole('textbox', { name: 'Address title' }) as HTMLInputElement;
    const $firstnameField = screen.getByRole('textbox', {
      name: "Recipient's first name",
    }) as HTMLInputElement;
    const $lastnameField = screen.getByRole('textbox', {
      name: "Recipient's last name",
    }) as HTMLInputElement;

    expect($titleField).toHaveValue(address.title);
    expect($firstnameField).toHaveValue(address.first_name);
    expect($lastnameField).toHaveValue(address.last_name);
    expect(screen.getByRole('textbox', { name: 'Address' })).toHaveValue(address.address);
    expect(screen.getByRole('textbox', { name: 'City' })).toHaveValue(address.city);
    expect(screen.getByRole('textbox', { name: 'Postcode' })).toHaveValue(address.postcode);
    expect(
      within(screen.getByRole('combobox', { name: 'Country' })).getByDisplayValue(address.country),
    ).toBeInTheDocument();

    const $saveField = screen.queryByRole('checkbox', { name: 'Save this address' });
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

    await user.type($titleField, 'Home');
    await user.type($firstnameField, 'John');
    await user.type($lastnameField, 'DOE');
    await user.click(screen.getByRole('button', { name: 'Update this address' }));

    // - Form should be restored and addresses should be updated
    expect(screen.getByRole('checkbox', { name: /Save this address/ })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Add a new address' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('form')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Use this address' })).toBeInTheDocument();
    expect(screen.getByText('Home')).toBeInTheDocument();

    // User clicks on edit button again
    await user.click(screen.getByRole('button', { name: 'Edit "Home" address' }));

    // - Form should be updated
    expect(
      screen.getByRole('heading', { level: 2, name: `Update address Home` }),
    ).toBeInTheDocument();

    expect(screen.getByRole('textbox', { name: 'Address title' })).toHaveValue('Home');
    expect(
      screen.getByRole('textbox', {
        name: "Recipient's first name",
      }),
    ).toHaveValue('John');
    expect(
      screen.getByRole('textbox', {
        name: "Recipient's last name",
      }),
    ).toHaveValue('DOE');

    expect(screen.getByRole('textbox', { name: 'Address' })).toHaveValue(address.address);
    expect(screen.queryByRole('textbox', { name: 'City' })).toHaveValue(address.city);
    expect(screen.queryByRole('textbox', { name: 'Postcode' })).toHaveValue(address.postcode);
    expect(
      within(screen.getByRole('combobox', { name: 'Country' })).getByDisplayValue(address.country),
    ).toBeInTheDocument();
    expect($saveField).toBeNull();

    // - But finally user cancels his action
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    // - Form should be restored and addresses should be updated
    expect(
      screen.getByRole('heading', { level: 2, name: 'Add a new address' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('form')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /Save this address/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Use this address' })).toBeInTheDocument();
  });

  it('allows user to delete an existing address', async () => {
    const address = AddressFactory().one();
    fetchMock.get('https://joanie.endpoint/api/v1.0/addresses/', [address]);

    const { container } = render(
      <Wrapper>
        <AddressesManagement handleClose={handleClose} selectAddress={selectAddress} />
      </Wrapper>,
    );
    await waitFor(() => {
      expect(fetchMock.calls().map((call) => call[0])).toContain(
        'https://joanie.endpoint/api/v1.0/addresses/',
      );
    });

    // - User deletes his only existing address
    fetchMock
      .delete(`https://joanie.endpoint/api/v1.0/addresses/${address.id}/`, {})
      .get('https://joanie.endpoint/api/v1.0/addresses/', [], { overwriteRoutes: true });

    await user.click(
      await screen.findByRole('button', {
        name: `Delete "${address.title}" address`,
      }),
    );

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

    render(
      <Wrapper>
        <AddressesManagement handleClose={handleClose} selectAddress={selectAddress} />
      </Wrapper>,
    );

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

    await user.click($promoteButton);

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

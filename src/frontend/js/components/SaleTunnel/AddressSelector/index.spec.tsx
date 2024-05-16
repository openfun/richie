import { screen, waitFor } from '@testing-library/react';
import { useMemo, useState } from 'react';
import fetchMock from 'fetch-mock';
import countries from 'i18n-iso-countries';
import userEvent from '@testing-library/user-event';
import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import { setupJoanieSession } from 'utils/test/wrappers/JoanieAppWrapper';
import {
  SaleTunnelStep,
  SaleTunnelContext,
  SaleTunnelContextType,
} from 'components/SaleTunnel/GenericSaleTunnel';
import { Address } from 'types/Joanie';
import {
  AddressFactory,
  CredentialOrderFactory,
  ProductFactory,
} from 'utils/test/factories/joanie';
import { SaleTunnelProps } from 'components/SaleTunnel/index';
import { AddressSelector, getAddressLabel } from 'components/SaleTunnel/AddressSelector/index';
import { render } from 'utils/test/render';
import { changeSelect } from 'components/Form/test-utils';
import { expectMenuToBeClosed, expectMenuToBeOpen } from 'utils/test/Cunningham';
import { sleep } from 'utils/sleep';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: { backend: 'fonzie', endpoint: 'https://auth.test' },
    joanie_backend: { endpoint: 'https://joanie.endpoint' },
  }).one(),
}));

jest.mock('utils/indirection/window', () => ({
  matchMedia: () => ({
    matches: true,
    addListener: jest.fn(),
    removeListener: jest.fn(),
  }),
}));

describe('AddressSelector', () => {
  setupJoanieSession();

  const buildWrapper = () => {
    const contextRef = {
      current: {} as SaleTunnelContextType,
    };

    const Wrapper = () => {
      const [billingAddress, setBillingAddress] = useState<Address>();
      const context: SaleTunnelContextType = useMemo(
        () => ({
          webAnalyticsEventKey: 'eventKey',
          order: CredentialOrderFactory().one(),
          product: ProductFactory().one(),
          props: {} as SaleTunnelProps,
          billingAddress,
          setBillingAddress,
          setCreditCard: jest.fn(),
          onPaymentSuccess: jest.fn(),
          step: SaleTunnelStep.PAYMENT,
          registerSubmitCallback: jest.fn(),
          unregisterSubmitCallback: jest.fn(),
          runSubmitCallbacks: jest.fn(),
        }),
        [billingAddress],
      );
      contextRef.current = context;

      return (
        <SaleTunnelContext.Provider value={context}>
          <AddressSelector />
        </SaleTunnelContext.Provider>
      );
    };

    return { contextRef, Wrapper };
  };

  it('has no billing address and create one', async () => {
    const { contextRef, Wrapper } = buildWrapper();
    render(<Wrapper />);
    expect(contextRef.current.billingAddress).toBeUndefined();

    const billingAddressInput = screen.getByRole('combobox', {
      name: 'Billing address',
    });

    // No address is selected.
    expect(billingAddressInput).toHaveTextContent('Billing addressarrow_drop_down');

    // Create an address.
    const createAddressButton = screen.getByRole('button', {
      name: /Create/i,
    });
    const user = userEvent.setup();
    await user.click(createAddressButton);

    screen.getByText('Add address');

    const $titleField = screen.getByRole('textbox', { name: 'Address title' });
    const $firstnameField = screen.getByRole('textbox', { name: "Recipient's first name" });
    const $lastnameField = screen.getByRole('textbox', { name: "Recipient's last name" });
    const $addressField = screen.getByRole('textbox', { name: 'Address' });
    const $cityField = screen.getByRole('textbox', { name: 'City' });
    const $postcodeField = screen.getByRole('textbox', { name: 'Postcode' });
    const $countryField = screen.getByRole('combobox', { name: 'Country' });
    const $submitButton = screen.getByRole('button', {
      name: 'Create',
    }) as HTMLButtonElement;

    // - User fulfills address fields
    const address = AddressFactory({ is_main: true }).one();
    fetchMock.post('https://joanie.endpoint/api/v1.0/addresses/', address);
    fetchMock.get('https://joanie.endpoint/api/v1.0/addresses/', [address], {
      overwriteRoutes: true,
    });

    await user.type($titleField, address.title);
    await user.type($firstnameField, address.first_name);
    await user.type($lastnameField, address.last_name);
    await user.type($addressField, address.address);
    await user.type($cityField, address.city);
    await user.type($postcodeField, address.postcode);
    await changeSelect($countryField, countries.getName(address?.country, 'en')!, user);
    await user.click($submitButton);

    await waitFor(() => {
      expect(billingAddressInput).toHaveTextContent(
        'Billing address' + getAddressLabel(address) + 'closearrow_drop_down',
      );
    });
  });
  it('has an existing main billing address and choose another', async () => {
    const address = AddressFactory({
      is_main: true,
    }).one();
    const addresses = [...AddressFactory().many(3), address];
    fetchMock.get('https://joanie.endpoint/api/v1.0/addresses/', addresses, {
      overwriteRoutes: true,
    });

    const { contextRef, Wrapper } = buildWrapper();
    render(<Wrapper />);
    expect(contextRef.current.billingAddress).toBeUndefined();

    const billingAddressInput = screen.getByRole('combobox', {
      name: 'Billing address',
    });

    // Main address is selected.
    await waitFor(() =>
      expect(billingAddressInput).toHaveTextContent(
        'Billing address' + getAddressLabel(address) + 'closearrow_drop_down',
      ),
    );

    const user = userEvent.setup();
    const menu: HTMLDivElement = screen.getByRole('listbox', {
      name: 'Billing address',
    });
    expectMenuToBeClosed(menu);

    // Open menu.
    await user.click(billingAddressInput);
    expectMenuToBeOpen(menu);

    // make sure all addresses are in the list.
    addresses.forEach((addr) => {
      screen.getByRole('option', {
        name: getAddressLabel(addr).replace('- ', ''),
      });
    });

    // select new address.
    await user.click(
      screen.getByRole('option', {
        name: getAddressLabel(addresses[1]).replace('- ', ''),
      }),
    );

    expect(billingAddressInput).toHaveTextContent(
      'Billing address' + getAddressLabel(addresses[1]) + 'closearrow_drop_down',
    );
  });
  it('has an existing main billing address and edit it', async () => {
    const address = AddressFactory({
      is_main: true,
    }).one();
    const newAddress = AddressFactory({
      is_main: true,
    }).one();
    newAddress.id = address.id;
    const addresses = [...AddressFactory().many(3), address];
    fetchMock.get('https://joanie.endpoint/api/v1.0/addresses/', addresses, {
      overwriteRoutes: true,
    });

    const { contextRef, Wrapper } = buildWrapper();
    render(<Wrapper />);
    expect(contextRef.current.billingAddress).toBeUndefined();

    const billingAddressInput = screen.getByRole('combobox', {
      name: 'Billing address',
    });

    // Main address is selected.
    await waitFor(() =>
      expect(billingAddressInput).toHaveTextContent(
        'Billing address' + getAddressLabel(address) + 'closearrow_drop_down',
      ),
    );

    const user = userEvent.setup();
    // edit address.
    const editButton = screen.getByRole('button', {
      name: /Edit/i,
    });
    await user.click(editButton);

    // edit modal.
    screen.getByText('Edit address');

    const $titleField = screen.getByRole('textbox', { name: 'Address title' });
    const $firstnameField = screen.getByRole('textbox', { name: "Recipient's first name" });
    const $lastnameField = screen.getByRole('textbox', { name: "Recipient's last name" });
    const $addressField = screen.getByRole('textbox', { name: 'Address' });
    const $cityField = screen.getByRole('textbox', { name: 'City' });
    const $postcodeField = screen.getByRole('textbox', { name: 'Postcode' });
    const $countryField = screen.getByRole('combobox', { name: 'Country' });
    const $submitButton = screen.getByRole('button', {
      name: 'Save',
    }) as HTMLButtonElement;

    // - User fulfills address fields
    const newAddresses = [...addresses.slice(0, 3), newAddress];
    fetchMock.put(`https://joanie.endpoint/api/v1.0/addresses/${address.id}/`, newAddress);
    fetchMock.get('https://joanie.endpoint/api/v1.0/addresses/', newAddresses, {
      overwriteRoutes: true,
    });

    expect($titleField).toHaveValue(address.title);
    expect($firstnameField).toHaveValue(address.first_name);
    expect($lastnameField).toHaveValue(address.last_name);
    expect($addressField).toHaveValue(address.address);
    expect($cityField).toHaveValue(address.city);
    expect($postcodeField).toHaveValue(address.postcode);
    expect($countryField).toHaveTextContent(countries.getName(address?.country, 'en')!);

    await user.type($titleField, newAddress.title);
    await user.type($firstnameField, newAddress.first_name);
    await user.type($lastnameField, newAddress.last_name);
    await user.type($addressField, newAddress.address);
    await user.type($cityField, newAddress.city);
    await user.type($postcodeField, newAddress.postcode);
    await changeSelect($countryField, countries.getName(newAddress?.country, 'en')!, user);

    await user.click($submitButton);

    await sleep(500);

    // TODO: This should work, it is caused by a Cunningham bug.
    await waitFor(() =>
      expect(billingAddressInput).toHaveTextContent(
        'Billing address' + getAddressLabel(newAddress) + 'closearrow_drop_down',
      ),
    );
  });
});

/**
 * Test suite for AddressesManagement component
 */
import { yupResolver } from '@hookform/resolvers/yup';
import { fireEvent, render, screen } from '@testing-library/react';
import { act, renderHook } from '@testing-library/react-hooks';
import faker from 'faker';
import fetchMock from 'fetch-mock';
import * as mockFactories from 'utils/test/factories';
import { IntlProvider } from 'react-intl';
import { QueryClientProvider } from 'react-query';
import { useForm } from 'react-hook-form';
import { SessionProvider } from 'data/SessionProvider';
import { REACT_QUERY_SETTINGS, RICHIE_USER_TOKEN } from 'settings';
import type * as Joanie from 'types/Joanie';
import createQueryClient from 'utils/react-query/createQueryClient';
import validationSchema from './validationSchema';
import AddressesManagement from '.';

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

describe('validationSchema', () => {
  // Creation and Update form validation relies on a schema resolves by Yup.
  it('should not have error if values are valid', async () => {
    const defaultValues = {
      address: faker.address.streetAddress(),
      city: faker.address.city(),
      country: faker.address.countryCode(),
      first_name: faker.name.firstName(),
      last_name: faker.name.lastName(),
      postcode: faker.address.zipCode(),
      title: faker.random.word(),
      save: false,
    };

    const { result } = renderHook(() =>
      useForm({
        defaultValues,
        resolver: yupResolver(validationSchema),
      }),
    );

    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    result.current.formState.errors;
    result.current.register('address');
    result.current.register('city');
    result.current.register('country');
    result.current.register('first_name');
    result.current.register('last_name');
    result.current.register('postcode');
    result.current.register('title');
    result.current.register('save');

    await act(async () => {
      result.current.trigger();
    });

    const { formState } = result.current;

    expect(formState.errors.address).not.toBeDefined();
    expect(formState.errors.city).not.toBeDefined();
    expect(formState.errors.country).not.toBeDefined();
    expect(formState.errors.first_name).not.toBeDefined();
    expect(formState.errors.last_name).not.toBeDefined();
    expect(formState.errors.postcode).not.toBeDefined();
    expect(formState.errors.title).not.toBeDefined();
    expect(formState.errors.save).not.toBeDefined();
    expect(formState.isValid).toBe(true);
  });

  it('should have an error if values are invalid', async () => {
    const { result } = renderHook(() =>
      useForm({
        resolver: yupResolver(validationSchema),
      }),
    );

    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    result.current.formState.errors;
    result.current.register('address');
    result.current.register('city');
    result.current.register('country');
    result.current.register('first_name');
    result.current.register('last_name');
    result.current.register('postcode');
    result.current.register('title');
    result.current.register('save');

    // - Trigger form validation with empty values
    await act(async () => {
      result.current.trigger();
    });

    let { formState } = result.current;
    expect(formState.errors.address.type).toEqual('required');
    expect(formState.errors.address.message).toEqual('address is a required field');
    expect(formState.errors.city.type).toEqual('required');
    expect(formState.errors.city.message).toEqual('city is a required field');
    expect(formState.errors.country.type).toEqual('required');
    expect(formState.errors.country.message).toEqual('country is a required field');
    expect(formState.errors.first_name.type).toEqual('required');
    expect(formState.errors.first_name.message).toEqual('first_name is a required field');
    expect(formState.errors.last_name.type).toEqual('required');
    expect(formState.errors.last_name.message).toEqual('last_name is a required field');
    expect(formState.errors.postcode.type).toEqual('required');
    expect(formState.errors.postcode.message).toEqual('postcode is a required field');
    expect(formState.errors.title.type).toEqual('required');
    expect(formState.errors.title.message).toEqual('title is a required field');
    expect(formState.errors.save).not.toBeDefined();
    expect(formState.isValid).toBe(false);

    // - Set values for all field but with a wrong one for country field
    await act(async () => {
      result.current.setValue('address', faker.address.streetAddress());
      result.current.setValue('city', faker.address.city());
      // set country value with an invalid country code
      result.current.setValue('country', 'AA');
      result.current.setValue('first_name', faker.name.firstName());
      result.current.setValue('last_name', faker.name.lastName());
      result.current.setValue('postcode', faker.address.zipCode());
      result.current.setValue('title', faker.random.word());
      result.current.trigger();
    });

    formState = result.current.formState;
    expect(formState.errors.address).not.toBeDefined();
    expect(formState.errors.city).not.toBeDefined();
    expect(formState.errors.country.type).toEqual('oneOf');
    expect(formState.errors.country.message).toContain(
      'country must be one of the following values:',
    );
    expect(formState.errors.first_name).not.toBeDefined();
    expect(formState.errors.last_name).not.toBeDefined();
    expect(formState.errors.postcode).not.toBeDefined();
    expect(formState.errors.title).not.toBeDefined();
    expect(formState.errors.save).not.toBeDefined();
    expect(formState.isValid).toBe(false);

    // - Set country value with a valid country code
    await act(async () => {
      result.current.setValue('country', 'FR');
      result.current.trigger();
    });

    formState = result.current.formState;
    expect(formState.errors.address).not.toBeDefined();
    expect(formState.errors.city).not.toBeDefined();
    expect(formState.errors.country).not.toBeDefined();
    expect(formState.errors.first_name).not.toBeDefined();
    expect(formState.errors.last_name).not.toBeDefined();
    expect(formState.errors.postcode).not.toBeDefined();
    expect(formState.errors.title).not.toBeDefined();
    expect(formState.errors.save).not.toBeDefined();
    expect(formState.isValid).toBe(true);
  });
});

describe('AddressesManagement', () => {
  const initializeUser = () => {
    const user = mockFactories.FonzieUserFactory.generate();

    sessionStorage.setItem(
      REACT_QUERY_SETTINGS.cacheStorage.key,
      JSON.stringify(
        mockFactories.PersistedClientFactory({
          queries: [mockFactories.QueryStateFactory('user', { data: user })],
        }),
      ),
    );
    sessionStorage.setItem(RICHIE_USER_TOKEN, user.access_token);
  };

  const handleClose = jest.fn();
  const selectAddress = jest.fn();

  beforeEach(() => {
    fetchMock.get('https://joanie.endpoint/api/orders/', []);
    fetchMock.get('https://joanie.endpoint/api/credit-cards/', []);
  });

  afterEach(() => {
    jest.clearAllMocks();
    fetchMock.restore();
    sessionStorage.clear();
  });

  it('renders a go back button', async () => {
    initializeUser();
    fetchMock.get('https://joanie.endpoint/api/addresses/', []);

    await act(async () => {
      render(
        <QueryClientProvider client={createQueryClient({ persistor: true })}>
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

  it('renders a form to create an address', async () => {
    initializeUser();
    fetchMock.get('https://joanie.endpoint/api/addresses/', []);

    await act(async () => {
      render(
        <QueryClientProvider client={createQueryClient({ persistor: true })}>
          <IntlProvider locale="en">
            <SessionProvider>
              <AddressesManagement handleClose={handleClose} selectAddress={selectAddress} />
            </SessionProvider>
          </IntlProvider>
        </QueryClientProvider>,
      );
    });

    screen.getByRole('heading', { level: 5, name: 'Add a new address' });
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

    // - Until form is not fulfill, submit button should be disabled
    expect($submitButton.disabled).toBe(true);

    // - User fulfills address fields
    let address = mockFactories.AddressFactory.generate();
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

    // Once the form has been fulfilled properly, submit button should be enabled.
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
    address = mockFactories.AddressFactory.generate();
    fetchMock.post('https://joanie.endpoint/api/addresses/', {
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

  it("renders the user's addresses", async () => {
    initializeUser();
    const addresses = mockFactories.AddressFactory.generate(Math.ceil(Math.random() * 5));
    fetchMock.get('https://joanie.endpoint/api/addresses/', addresses);

    let container: HTMLElement;

    await act(async () => {
      ({ container } = render(
        <QueryClientProvider client={createQueryClient({ persistor: true })}>
          <IntlProvider locale="en">
            <SessionProvider>
              <AddressesManagement handleClose={handleClose} selectAddress={selectAddress} />
            </SessionProvider>
          </IntlProvider>
        </QueryClientProvider>,
      ));
    });

    // All user's addresses should be displayed
    const $addresses = container!.querySelectorAll('.registered-addresses-item');
    expect($addresses).toHaveLength(addresses.length);

    addresses.forEach((address: Joanie.Address) => {
      const $address = screen.getByTestId(`address-${address.id}-title`);
      expect($address.textContent).toEqual(address.title);
    });

    // - User selects one of its existing address
    const address = addresses[0];
    const $selectButton = screen.getByRole('button', {
      name: `Select "${address.title}" address`,
      exact: true,
    });
    await act(async () => {
      fireEvent.click($selectButton);
    });
    expect(selectAddress).toHaveBeenNthCalledWith(1, address);
  });

  it('renders an updated form when user selects an address to edit', async () => {
    initializeUser();
    const address = mockFactories.AddressFactory.generate();
    fetchMock.get('https://joanie.endpoint/api/addresses/', [address]);

    await act(async () => {
      render(
        <QueryClientProvider client={createQueryClient({ persistor: true })}>
          <IntlProvider locale="en">
            <SessionProvider>
              <AddressesManagement handleClose={handleClose} selectAddress={selectAddress} />
            </SessionProvider>
          </IntlProvider>
        </QueryClientProvider>,
      );
    });

    // - First the creation form should be displayed
    screen.getByRole('heading', { level: 5, name: 'Add a new address' });
    screen.getByRole('form');
    screen.getByRole('checkbox', { name: 'Save this address' });
    screen.getByRole('button', { name: 'Use this address' });

    // - Then user selects an address to edit
    let $editButton = screen.getByRole('button', {
      name: `Edit "${address.title}" address`,
      exact: true,
    });
    await act(async () => {
      fireEvent.click($editButton);
    });

    // - Form should be updated
    screen.getByRole('heading', { level: 5, name: `Update address ${address.title}` });

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

    // - User edits some values then submits its changes
    fetchMock
      .put(`https://joanie.endpoint/api/addresses/${address.id}/`, {
        ...address,
        title: 'Home',
        first_name: 'John',
        last_name: 'DOE',
      })
      .get(
        'https://joanie.endpoint/api/addresses/',
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
    screen.getByRole('heading', { level: 5, name: 'Add a new address' });
    screen.getByRole('form');
    screen.getByRole('checkbox', { name: 'Save this address' });
    screen.getByRole('button', { name: 'Use this address' });
    screen.getByText('Home');

    // User clicks on edit button again
    $editButton = screen.getByRole('button', { name: 'Edit "Home" address', exact: true });
    await act(async () => {
      fireEvent.click($editButton);
    });

    // - Form should be updated
    screen.getByRole('heading', { level: 5, name: `Update address Home` });

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
    const $cancelButton = screen.getByRole('button', { name: 'Cancel', exact: true });
    await act(async () => {
      fireEvent.click($cancelButton);
    });

    // - Form should be restored and addresses should be updated
    screen.getByRole('heading', { level: 5, name: 'Add a new address' });
    screen.getByRole('form');
    screen.getByRole('checkbox', { name: 'Save this address' });
    screen.getByRole('button', { name: 'Use this address' });
  });

  it('allows user to delete an existing address', async () => {
    initializeUser();
    const address = mockFactories.AddressFactory.generate();
    fetchMock.get('https://joanie.endpoint/api/addresses/', [address]);

    let container: HTMLElement;
    await act(async () => {
      ({ container } = render(
        <QueryClientProvider client={createQueryClient({ persistor: true })}>
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
      .delete(`https://joanie.endpoint/api/addresses/${address.id}/`, {})
      .get('https://joanie.endpoint/api/addresses/', [], { overwriteRoutes: true });

    const $deleteButton = screen.getByRole('button', {
      name: `Delete "${address.title}" address`,
      exact: true,
    });

    await act(async () => {
      fireEvent.click($deleteButton);
    });

    // - As this was the only existing address,
    //   registered addresses section should be hidden

    expect(screen.queryByRole('heading', { level: 5, name: 'Your addresses' })).toBeNull();
    const $addresses = container!.querySelectorAll('.registered-addresses-item');
    expect($addresses).toHaveLength(0);
  });

  it('allows user to promote an address as main', async () => {
    initializeUser();
    const [address1, address2] = mockFactories.AddressFactory.generate(2);
    address1.is_main = true;
    fetchMock.get('https://joanie.endpoint/api/addresses/', [address1, address2]);

    await act(async () => {
      render(
        <QueryClientProvider client={createQueryClient({ persistor: true })}>
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
      .put(`https://joanie.endpoint/api/addresses/${address2.id}/`, {
        ...address2,
        is_main: true,
      })
      .get(
        'https://joanie.endpoint/api/addresses/',
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

    const $promoteButton = screen.getByRole('button', {
      name: `Define "${address2.title}" address as main`,
      exact: true,
    });

    await act(async () => {
      fireEvent.click($promoteButton);
    });

    const $address1PromoteIndicator = screen.getByRole('button', {
      name: `Define "${address1.title}" address as main`,
      exact: true,
    });
    const $address1MainIndicator =
      $address1PromoteIndicator.querySelector('.address-main-indicator')!;
    const $address2PromoteButton = screen.getByRole('button', {
      name: `Define "${address2.title}" address as main`,
      exact: true,
    });
    const $address2MainIndicator = $address2PromoteButton.querySelector('.address-main-indicator')!;

    expect($address1MainIndicator.classList).not.toContain('address-main-indicator--is-main');
    expect($address2MainIndicator.classList).toContain('address-main-indicator--is-main');
  });
});

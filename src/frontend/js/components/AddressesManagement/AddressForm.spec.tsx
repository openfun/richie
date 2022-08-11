import { act } from '@testing-library/react-hooks';
import { fireEvent, getByText, render, screen } from '@testing-library/react';
import * as mockFactories from 'utils/test/factories';
import { AddressFactory } from 'utils/test/factories';
import countries from 'i18n-iso-countries';
import { IntlProvider } from 'react-intl';
import { Address } from 'types/Joanie';
import { ErrorKeys } from './validationSchema';
import AddressForm from './AddressForm';

jest.mock('hooks/useAddresses', () => ({
  useAddresses: () => ({
    states: {
      creating: false,
      updating: false,
    },
  }),
}));

describe('AddressForm', () => {
  const handleReset = jest.fn();
  const onSubmit = jest.fn();

  beforeEach(() => {
    jest.resetAllMocks();
    jest.resetModules();
  });

  it('renders a button with label "Use this address" when no address is provided', () => {
    render(
      <IntlProvider locale="en">
        <AddressForm handleReset={handleReset} onSubmit={onSubmit} />
      </IntlProvider>,
    );

    screen.getByRole('button', { name: 'Use this address' });
    expect(screen.queryByRole('button', { name: 'Cancel' })).toBeNull();
  });

  it('renders a button with label "Use this address" and a cancel button when no address is provided', async () => {
    const address: Address = AddressFactory.generate();
    render(
      <IntlProvider locale="en">
        <AddressForm handleReset={handleReset} onSubmit={onSubmit} address={address} />
      </IntlProvider>,
    );

    screen.getByRole('button', { name: 'Update this address' });

    const $button = screen.getByRole('button', { name: 'Cancel' });
    await act(async () => {
      fireEvent.click($button);
    });
    expect(handleReset).toHaveBeenCalledTimes(1);
  });

  it('renders an error message when a value in the form is invalid', async () => {
    render(
      <IntlProvider locale="en">
        <AddressForm handleReset={handleReset} onSubmit={onSubmit} />
      </IntlProvider>,
    );

    screen.getByRole('form');
    const $titleInput = screen.getByRole('textbox', { name: 'Address title' });
    const $firstnameInput = screen.getByRole('textbox', { name: "Recipient's first name" });
    const $lastnameInput = screen.getByRole('textbox', { name: "Recipient's last name" });
    const $addressInput = screen.getByRole('textbox', { name: 'Address' });
    const $cityInput = screen.getByRole('textbox', { name: 'City' });
    const $postcodeInput = screen.getByRole('textbox', { name: 'Postcode' });
    const $countryInput = screen.getByRole('combobox', { name: 'Country' });
    const $submitButton = screen.getByRole('button', {
      name: 'Use this address',
    }) as HTMLButtonElement;

    // - Until form is not fulfill, submit button should be disabled
    expect($submitButton.disabled).toBe(true);

    // - User fulfills address fields
    const address = mockFactories.AddressFactory.generate();

    await act(async () => {
      fireEvent.input($titleInput, { target: { value: address.title } });
      fireEvent.change($firstnameInput, { target: { value: address.first_name } });
      fireEvent.change($lastnameInput, { target: { value: address.last_name } });
      fireEvent.change($addressInput, { target: { value: address.address } });
      fireEvent.change($cityInput, { target: { value: address.city } });
      fireEvent.change($postcodeInput, { target: { value: address.postcode } });
      fireEvent.change($countryInput, { target: { value: address.country } });
      // - As form validation is triggered on blur, we need to trigger this event in
      //   order to update form state.
      fireEvent.blur($countryInput);
    });

    // Once the form has been fulfilled properly, submit button should be enabled.
    expect($submitButton.disabled).toBe(false);

    // Before submitting, we change field values to corrupt the form data
    await act(async () => {
      fireEvent.input($titleInput, { target: { value: 'a' } });
      fireEvent.input($firstnameInput, { target: { value: '' } });
      fireEvent.change($countryInput, { target: { value: '-' } });
      fireEvent.click($submitButton);
    });

    expect(onSubmit).not.toHaveBeenCalled();

    // Error messages should have been displayed.
    // Title field should have a message saying that the value is too short.
    getByText($titleInput.closest('.form-field')!, 'The minimum length is 2 chars.');
    // Firstname field should have a message saying that the value is required.
    getByText($firstnameInput.closest('.form-field')!, 'This field is required.');
    // Country field should have a message saying that the value is not valid.
    getByText(
      $countryInput.closest('.form-field')!,
      `You must select a value within: ${Object.keys(countries.getAlpha2Codes()).join(', ')}.`,
    );
  });

  it('renders default error message when error message does not exist', async () => {
    jest.doMock('./validationSchema', () => ({
      __esModule: true,
      ...jest.requireActual('./validationSchema'),
      errorMessages: {
        [ErrorKeys.MIXED_INVALID]: {
          id: 'components.AddressesManagement.validationSchema.mixedInvalid',
          defaultMessage: 'This field is invalid.',
          description: 'Error message displayed when a field value is invalid.',
        },
      },
    }));

    // Import locally to get module with mocked error messages.
    const Form = jest.requireActual('./AddressForm').default;

    render(
      <IntlProvider locale="en">
        <Form handleReset={handleReset} onSubmit={onSubmit} />
      </IntlProvider>,
    );

    screen.getByRole('form');
    const $titleInput = screen.getByRole('textbox', { name: 'Address title' });
    const $firstnameInput = screen.getByRole('textbox', { name: "Recipient's first name" });
    const $lastnameInput = screen.getByRole('textbox', { name: "Recipient's last name" });
    const $addressInput = screen.getByRole('textbox', { name: 'Address' });
    const $cityInput = screen.getByRole('textbox', { name: 'City' });
    const $postcodeInput = screen.getByRole('textbox', { name: 'Postcode' });
    const $countryInput = screen.getByRole('combobox', { name: 'Country' });
    const $submitButton = screen.getByRole('button', {
      name: 'Use this address',
    }) as HTMLButtonElement;

    // - Until form is not fulfill, submit button should be disabled
    expect($submitButton.disabled).toBe(true);

    // - User fulfills address fields
    const address = mockFactories.AddressFactory.generate();

    await act(async () => {
      fireEvent.input($titleInput, { target: { value: address.title } });
      fireEvent.change($firstnameInput, { target: { value: address.first_name } });
      fireEvent.change($lastnameInput, { target: { value: address.last_name } });
      fireEvent.change($addressInput, { target: { value: address.address } });
      fireEvent.change($cityInput, { target: { value: address.city } });
      fireEvent.change($postcodeInput, { target: { value: address.postcode } });
      fireEvent.change($countryInput, { target: { value: address.country } });
      // - As form validation is triggered on blur, we need to trigger this event in
      //   order to update form state.
      fireEvent.blur($countryInput);
    });

    // Once the form has been fulfilled properly, submit button should be enabled.
    expect($submitButton.disabled).toBe(false);

    // Before submitting, we change field values to corrupt the form data
    await act(async () => {
      fireEvent.input($titleInput, { target: { value: 'a' } });
      fireEvent.input($firstnameInput, { target: { value: '' } });
      fireEvent.change($countryInput, { target: { value: '-' } });
      fireEvent.click($submitButton);
    });

    expect(onSubmit).not.toHaveBeenCalled();

    // Default error messages should have been displayed.
    getByText($titleInput.closest('.form-field')!, 'This field is invalid.');
    getByText($firstnameInput.closest('.form-field')!, 'This field is invalid.');
    getByText($countryInput.closest('.form-field')!, `This field is invalid.`);
  });
});

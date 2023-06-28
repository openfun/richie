import { act, fireEvent, getByText, render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { Address } from 'types/Joanie';
import { AddressFactory } from 'utils/test/factories/joanie';
import AddressForm from './AddressForm';
import { ErrorKeys } from './ValidationErrors';

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

  it('shows a note about required fields', () => {
    const { container } = render(
      <IntlProvider locale="en">
        <AddressForm handleReset={handleReset} onSubmit={onSubmit} />
      </IntlProvider>,
    );

    // we use this form of testing because screen.getByText doesn't seem
    // to handle text broken into multiple DOM elements correctly
    expect(container).toHaveTextContent('Fields marked with * are required');

    // the note should be rendered before any inputs
    // we assume that it's the case if it's the first child of the form
    expect(
      container.querySelector(
        'form[name="address-form"] > .form__required-fields-note:first-child',
      ),
    ).not.toBeNull();
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
    const address: Address = AddressFactory().one();
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

    // - submit button should be enabled even when the form is not valid,
    //   so that every user can get feedback easily (especially screen reader users)
    expect($submitButton.disabled).toBe(false);

    // - User fulfills address fields
    const address = AddressFactory().one();

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

    // Once the form has been fulfilled properly, submit button should still be enabled.
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
    getByText($countryInput.closest('.form-field')!, `You must select a value.`);
  });

  it('renders default error message when error message does not exist', async () => {
    jest.doMock('./ValidationErrors', () => ({
      __esModule: true,
      ...jest.requireActual('./ValidationErrors'),
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

    // - button should never be disabled to allow user feedback at any time
    expect($submitButton.disabled).toBe(false);

    // - User fulfills address fields
    const address = AddressFactory().one();

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

    // button should still be enabled especially now that there is no error
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

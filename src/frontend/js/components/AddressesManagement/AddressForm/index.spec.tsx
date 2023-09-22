import { act, fireEvent, getByText, render, screen, within } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import countries from 'i18n-iso-countries';
import { CunninghamProvider } from '@openfun/cunningham-react';
import userEvent, { UserEvent } from '@testing-library/user-event';
import { Address } from 'types/Joanie';
import { AddressFactory } from 'utils/test/factories/joanie';
import { changeSelect, clearSelect } from 'components/Form/test-utils';
import AddressForm from './index';

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
  const Wrapper = ({ address }: { address?: Address }) => (
    <IntlProvider locale="en">
      <CunninghamProvider>
        <AddressForm handleReset={handleReset} onSubmit={onSubmit} address={address} />
      </CunninghamProvider>
    </IntlProvider>
  );
  let user: UserEvent;

  beforeEach(() => {
    jest.resetAllMocks();
    jest.resetModules();
    user = userEvent.setup();
  });

  it('shows a note about required fields', () => {
    const { container } = render(<Wrapper />);

    // we use this form of testing because screen.getByText doesn't seem
    // to handle text broken into multiple DOM elements correctly
    expect(container).toHaveTextContent('All fields are required unless marked optional');

    // the note should be rendered before any inputs
    // we assume that it's the case if it's the first child of the form
    expect(
      container.querySelector(
        'form[name="address-form"] > .form__required-fields-note:first-child',
      ),
    ).not.toBeNull();
  });

  it('should initialize with given address', () => {
    const address = AddressFactory().one();
    render(<Wrapper address={address} />);

    expect(screen.getByRole('textbox', { name: 'Address title' })).toHaveDisplayValue(
      address.title,
    );
    expect(screen.getByRole('textbox', { name: "Recipient's first name" })).toHaveDisplayValue(
      address.first_name,
    );
    expect(screen.getByRole('textbox', { name: "Recipient's last name" })).toHaveDisplayValue(
      address.last_name,
    );
    expect(screen.getByRole('textbox', { name: 'Address' })).toHaveDisplayValue(address.address);
    expect(screen.getByRole('textbox', { name: 'Postcode' })).toHaveDisplayValue(address.postcode);
    expect(screen.getByRole('textbox', { name: 'City' })).toHaveDisplayValue(address.city);
    expect(
      within(screen.getByRole('combobox', { name: 'Country' })).getByDisplayValue(address.country),
    ).toBeInTheDocument();
  });

  it('should submit given address', async () => {
    const address = AddressFactory().one();
    render(<Wrapper address={address} />);
    await user.click(screen.getByRole('button', { name: 'Update this address' }));
    expect(onSubmit.mock.calls[0][0]).toStrictEqual(address);
  });

  it('renders a button with label "Use this address" when no address is provided', () => {
    render(<Wrapper />);

    screen.getByRole('button', { name: 'Use this address' });
    expect(screen.queryByRole('button', { name: 'Cancel' })).toBeNull();
  });

  it('renders a button with label "Use this address" and a cancel button when no address is provided', async () => {
    render(<Wrapper address={AddressFactory().one()} />);

    screen.getByRole('button', { name: 'Update this address' });

    const $button = screen.getByRole('button', { name: 'Cancel' });
    await act(async () => {
      fireEvent.click($button);
    });
    expect(handleReset).toHaveBeenCalledTimes(1);
  });

  it('renders an error message when a value in the form is invalid', async () => {
    render(<Wrapper />);

    // - submit button should be enabled even when the form is not valid,
    //   so that every user can get feedback easily (especially screen reader users)
    const $submitButton = screen.getByRole('button', {
      name: 'Use this address',
    }) as HTMLButtonElement;
    expect($submitButton.disabled).toBe(false);

    // - User fulfills address fields
    const address = AddressFactory().one();
    const $titleInput = screen.getByRole('textbox', { name: 'Address title' });
    const $firstnameInput = screen.getByRole('textbox', { name: "Recipient's first name" });
    const $countryInput = screen.getByRole('combobox', { name: 'Country' });
    await user.type($titleInput, address.title);
    await user.type($firstnameInput, address.first_name);
    await user.type(
      screen.getByRole('textbox', { name: "Recipient's last name" }),
      address.last_name,
    );
    await user.type(screen.getByRole('textbox', { name: 'Address' }), address.address);
    await user.type(screen.getByRole('textbox', { name: 'City' }), address.city);
    await user.type(screen.getByRole('textbox', { name: 'Postcode' }), address.postcode);

    await changeSelect($countryInput, countries.getName(address?.country, 'en')!, user);

    // Once the form has been fulfilled properly, submit button should still be enabled.
    expect($submitButton.disabled).toBe(false);

    // Before submitting, we change field values to corrupt the form data
    await user.clear($titleInput);
    await user.type($titleInput, 'a');
    await user.clear($firstnameInput);
    await clearSelect($countryInput, user);

    await act(async () => {
      fireEvent.click($submitButton);
    });

    expect(onSubmit).not.toHaveBeenCalled();

    // Error messages should have been displayed.
    // Title field should have a message saying that the value is too short.
    expect(
      getByText($titleInput.closest('.c__field')!, 'The minimum length is 2 chars.'),
    ).toBeInTheDocument();
    // Firstname field should have a message saying that the value is required.
    expect(
      getByText($firstnameInput.closest('.c__field')!, 'This field is required.'),
    ).toBeInTheDocument();
    // Country field should have a message saying that the value is not valid.
    expect(
      getByText($countryInput.closest('.c__field')!, /This field is required./),
    ).toBeInTheDocument();
  });
});

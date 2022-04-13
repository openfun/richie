import { yupResolver } from '@hookform/resolvers/yup';
import countries from 'i18n-iso-countries';
import { Fragment, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { FormattedMessage, useIntl } from 'react-intl';
import { messages } from 'components/AddressesManagement/index';
import { CheckboxField, SelectField, TextField } from 'components/Form';
import { useAddresses } from 'hooks/useAddresses';
import type { Address } from 'types/Joanie';
import validationSchema from './validationSchema';

export type AddressFormValues = Omit<Address, 'id' | 'is_main'> & { save: boolean };

interface Props {
  address?: Address;
  onSubmit: (values: AddressFormValues) => Promise<void>;
  handleReset: () => void;
}

const AddressForm = ({ handleReset, onSubmit, address }: Props) => {
  const defaultValues = {
    title: '',
    first_name: '',
    last_name: '',
    address: '',
    postcode: '',
    city: '',
    country: '-',
    save: false,
  } as AddressFormValues;

  const { register, handleSubmit, reset, formState } = useForm<AddressFormValues>({
    defaultValues,
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: yupResolver(validationSchema),
  });

  const addresses = useAddresses();
  const intl = useIntl();
  const [languageCode] = intl.locale.split('-');
  const countryList = countries.getNames(languageCode);

  /**
   * Prevent form to be submitted and clear `editedAddress` state.
   */
  const handleCancel = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    handleReset();
    return false;
  };

  useEffect(() => {
    reset(address || defaultValues);
  }, [address]);

  return (
    <form className="form" name="address-form" onSubmit={handleSubmit(onSubmit)}>
      <TextField
        aria-invalid={!!formState.errors.title}
        aria-required={true}
        id="title"
        label={intl.formatMessage(messages.titleInputLabel)}
        error={!!formState.errors.title}
        {...register('title')}
      />
      <div className="form-group">
        <TextField
          aria-invalid={!!formState.errors.first_name}
          aria-required={true}
          id="first_name"
          label={intl.formatMessage(messages.first_nameInputLabel)}
          error={!!formState.errors.first_name}
          {...register('first_name')}
        />
        <TextField
          aria-invalid={!!formState.errors.last_name}
          aria-required={true}
          id="last_name"
          label={intl.formatMessage(messages.last_nameInputLabel)}
          error={!!formState.errors.last_name}
          {...register('last_name')}
        />
      </div>
      <TextField
        aria-invalid={!!formState.errors.address}
        aria-required={true}
        id="address"
        label={intl.formatMessage(messages.addressInputLabel)}
        error={!!formState.errors.address}
        {...register('address')}
      />
      <div className="form-group">
        <TextField
          aria-invalid={!!formState.errors.postcode}
          aria-required={true}
          id="postcode"
          label={intl.formatMessage(messages.postcodeInputLabel)}
          error={!!formState.errors.postcode}
          {...register('postcode')}
        />
        <TextField
          aria-invalid={!!formState.errors.city}
          aria-required={true}
          id="city"
          label={intl.formatMessage(messages.cityInputLabel)}
          error={!!formState.errors.city}
          {...register('city')}
        />
      </div>
      <SelectField
        aria-invalid={!!formState.errors.country}
        aria-required={false}
        id="country"
        label={intl.formatMessage(messages.countryInputLabel)}
        error={!!formState.errors.country}
        {...register('country', { value: address?.country, required: true })}
      >
        <option disabled value="-">
          -
        </option>
        {Object.entries(countryList).map(([value, label]) => (
          <option key={`address-countryList-${value}`} value={value}>
            {label}
          </option>
        ))}
      </SelectField>
      {!address ? (
        <CheckboxField
          aria-invalid={!!formState.errors?.save}
          aria-required={false}
          id="save"
          label={intl.formatMessage(messages.saveInputLabel)}
          error={!!formState.errors?.save}
          {...register('save')}
        />
      ) : null}
      <footer className="form__footer">
        {address ? (
          <Fragment>
            <button
              className="button button-sale--tertiary"
              onClick={handleCancel}
              title={intl.formatMessage(messages.cancelTitleButton)}
            >
              <FormattedMessage {...messages.cancelButton} />
            </button>
            <button
              className="button button-sale--primary"
              disabled={!formState.isValid || addresses.states.updating}
              type="submit"
            >
              <FormattedMessage {...messages.updateButton} />
            </button>
          </Fragment>
        ) : (
          <button
            className="button button-sale--primary"
            disabled={!formState.isValid || addresses.states.creating || addresses.states.updating}
            type="submit"
          >
            <FormattedMessage {...messages.selectButton} />
          </button>
        )}
      </footer>
    </form>
  );
};

export default AddressForm;

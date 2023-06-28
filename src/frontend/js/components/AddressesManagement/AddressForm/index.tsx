import { yupResolver } from '@hookform/resolvers/yup';
import { Fragment, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { FormattedMessage, useIntl } from 'react-intl';
import { messages } from 'components/AddressesManagement/index';
import { CheckboxField, TextField } from 'components/Form';
import { CountrySelectField } from 'components/Form/CountrySelectField';
import { useAddresses } from 'hooks/useAddresses';
import type { Address } from 'types/Joanie';
import validationSchema, { getLocalizedErrorMessage } from './validationSchema';

export type AddressFormValues = Omit<Address, 'id' | 'is_main'> & { save: boolean | undefined };

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
      <p className="form__required-fields-note">
        <FormattedMessage {...messages.requiredFields} values={{ symbol: <span>*</span> }} />
      </p>
      <TextField
        aria-invalid={!!formState.errors.title}
        required
        id="title"
        label={intl.formatMessage(messages.titleInputLabel)}
        error={!!formState.errors.title}
        message={getLocalizedErrorMessage(intl, formState.errors.title?.message)}
        {...register('title')}
      />
      <div className="form-group">
        <TextField
          aria-invalid={!!formState.errors.first_name}
          required
          id="first_name"
          label={intl.formatMessage(messages.first_nameInputLabel)}
          error={!!formState.errors.first_name}
          message={getLocalizedErrorMessage(intl, formState.errors.first_name?.message)}
          {...register('first_name')}
        />
        <TextField
          aria-invalid={!!formState.errors.last_name}
          required
          id="last_name"
          label={intl.formatMessage(messages.last_nameInputLabel)}
          error={!!formState.errors.last_name}
          message={getLocalizedErrorMessage(intl, formState.errors.last_name?.message)}
          {...register('last_name')}
        />
      </div>
      <TextField
        aria-invalid={!!formState.errors.address}
        required
        id="address"
        label={intl.formatMessage(messages.addressInputLabel)}
        error={!!formState.errors.address}
        message={getLocalizedErrorMessage(intl, formState.errors.address?.message)}
        {...register('address')}
      />
      <div className="form-group">
        <TextField
          aria-invalid={!!formState.errors.postcode}
          required
          id="postcode"
          label={intl.formatMessage(messages.postcodeInputLabel)}
          error={!!formState.errors.postcode}
          message={getLocalizedErrorMessage(intl, formState.errors.postcode?.message)}
          {...register('postcode')}
        />
        <TextField
          aria-invalid={!!formState.errors.city}
          required
          id="city"
          label={intl.formatMessage(messages.cityInputLabel)}
          error={!!formState.errors.city}
          message={getLocalizedErrorMessage(intl, formState.errors.city?.message)}
          {...register('city')}
        />
      </div>
      <CountrySelectField
        aria-invalid={!!formState.errors.country}
        required
        id="country"
        label={intl.formatMessage(messages.countryInputLabel)}
        error={!!formState.errors.country}
        message={getLocalizedErrorMessage(intl, formState.errors.country?.message)}
        {...register('country', { value: address?.country, required: true })}
      />
      {!address ? (
        <CheckboxField
          aria-invalid={!!formState.errors?.save}
          id="save"
          label={intl.formatMessage(messages.saveInputLabel)}
          error={!!formState.errors?.save}
          message={getLocalizedErrorMessage(intl, formState.errors.save?.message)}
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
              disabled={addresses.states.updating}
              type="submit"
            >
              <FormattedMessage {...messages.updateButton} />
            </button>
          </Fragment>
        ) : (
          <button
            className="button button-sale--primary"
            disabled={addresses.states.creating || addresses.states.updating}
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

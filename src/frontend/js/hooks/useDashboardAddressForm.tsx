import { yupResolver } from '@hookform/resolvers/yup/dist/yup';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { defineMessages, useIntl } from 'react-intl';
import * as Yup from 'yup';
import countries from 'i18n-iso-countries';
import { getLocalizedErrorMessage } from 'components/AddressesManagement/AddressForm/validationSchema';
import { messages as managementMessages } from 'components/AddressesManagement';
import { CheckboxField, TextField } from 'components/Form';
import { CountrySelectField } from 'components/Form/CountrySelectField';
import { Address } from 'types/Joanie';

const messages = defineMessages({
  isMainInputLabel: {
    id: 'hooks.useDashboardAddressForm.isMainInputLabel',
    description: 'Label of the "is_main" input',
    defaultMessage: 'Use this address as default',
  },
});

// / ! \ If you need to edit the validation schema,
// you should also add/edit error messages above.
const validationSchema = Yup.object().shape({
  address: Yup.string().required(),
  city: Yup.string().required(),
  country: Yup.string().oneOf(Object.keys(countries.getAlpha2Codes())).required(),
  first_name: Yup.string().required(),
  last_name: Yup.string().required(),
  postcode: Yup.string().required(),
  title: Yup.string().required().min(2),
  is_main: Yup.boolean().required(),
});

export type AddressFormValues = Omit<Address, 'id'>;

/**
 * Hook to implement a form to edit or create an Address.
 *
 * @param {Address} address
 */
export const useDashboardAddressForm = (address?: Address) => {
  const intl = useIntl();

  const defaultValues = {
    title: '',
    first_name: '',
    last_name: '',
    address: '',
    postcode: '',
    city: '',
    country: '-',
    is_main: true,
  } as AddressFormValues;

  const { register, handleSubmit, reset, formState } = useForm<AddressFormValues>({
    defaultValues,
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: yupResolver(validationSchema),
  });

  useEffect(() => {
    reset(address || defaultValues);
  }, [address]);

  const FormView = (
    <form>
      <TextField
        aria-invalid={!!formState.errors.title}
        required
        id="title"
        label={intl.formatMessage(managementMessages.titleInputLabel)}
        error={!!formState.errors.title}
        message={getLocalizedErrorMessage(intl, formState.errors.title?.message)}
        {...register('title')}
      />
      <TextField
        aria-invalid={!!formState.errors.first_name}
        required
        id="first_name"
        label={intl.formatMessage(managementMessages.first_nameInputLabel)}
        error={!!formState.errors.first_name}
        message={getLocalizedErrorMessage(intl, formState.errors.first_name?.message)}
        {...register('first_name')}
      />
      <TextField
        aria-invalid={!!formState.errors.last_name}
        required
        id="last_name"
        label={intl.formatMessage(managementMessages.last_nameInputLabel)}
        error={!!formState.errors.last_name}
        message={getLocalizedErrorMessage(intl, formState.errors.last_name?.message)}
        {...register('last_name')}
      />
      <TextField
        aria-invalid={!!formState.errors.address}
        required
        id="address"
        label={intl.formatMessage(managementMessages.addressInputLabel)}
        error={!!formState.errors.address}
        message={getLocalizedErrorMessage(intl, formState.errors.address?.message)}
        {...register('address')}
      />
      <TextField
        aria-invalid={!!formState.errors.postcode}
        required
        id="postcode"
        label={intl.formatMessage(managementMessages.postcodeInputLabel)}
        error={!!formState.errors.postcode}
        message={getLocalizedErrorMessage(intl, formState.errors.postcode?.message)}
        {...register('postcode')}
      />
      <TextField
        aria-invalid={!!formState.errors.city}
        required
        id="city"
        label={intl.formatMessage(managementMessages.cityInputLabel)}
        error={!!formState.errors.city}
        message={getLocalizedErrorMessage(intl, formState.errors.city?.message)}
        {...register('city')}
      />
      <CountrySelectField
        aria-invalid={!!formState.errors.country}
        required
        id="country"
        label={intl.formatMessage(managementMessages.countryInputLabel)}
        error={!!formState.errors.country}
        message={getLocalizedErrorMessage(intl, formState.errors.country?.message)}
        {...register('country', { required: true })}
      />
      {!(address && address.is_main) && (
        <CheckboxField
          aria-invalid={!!formState.errors?.is_main}
          id="is_main"
          label={intl.formatMessage(messages.isMainInputLabel)}
          error={!!formState.errors?.is_main}
          message={getLocalizedErrorMessage(intl, formState.errors.is_main?.message)}
          {...register('is_main')}
        />
      )}
    </form>
  );

  return {
    FormView,
    handleSubmit,
  };
};

import { yupResolver } from '@hookform/resolvers/yup/dist/yup';
import { FormProvider, useForm } from 'react-hook-form';
import { FormattedMessage, defineMessages, useIntl } from 'react-intl';
import * as Yup from 'yup';
import countries from 'i18n-iso-countries';
import { Checkbox } from '@openfun/cunningham-react';

import { useEffect } from 'react';
import { getLocalizedCunninghamErrorProp } from 'components/Form/utils';
import { messages as managementMessages } from 'components/AddressesManagement';
import { messages as formMessages } from 'components/Form/messages';
import { CountrySelectField } from 'components/Form/CountrySelectField';
import Input from 'components/Form/Input';
import { Address } from 'types/Joanie';
import Form from 'components/Form';

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

  const form = useForm<AddressFormValues>({
    defaultValues: address || defaultValues,
    mode: 'onBlur',
    reValidateMode: 'onChange',
    resolver: yupResolver(validationSchema),
  });
  const { register, handleSubmit, formState } = form;

  useEffect(() => {
    form.reset(address ?? defaultValues);
  }, [address]);

  const FormView = (
    <FormProvider {...form}>
      <Form noValidate>
        <p className="form__required-fields-note">
          <FormattedMessage {...formMessages.formOptionalFieldsText} />
        </p>
        <Form.Row>
          <Input
            required
            fullWidth
            name="title"
            label={intl.formatMessage(managementMessages.titleInputLabel)}
          />
        </Form.Row>
        <Form.Row>
          <Input
            className="form-field"
            required
            name="first_name"
            label={intl.formatMessage(managementMessages.first_nameInputLabel)}
          />

          <Input
            className="form-field"
            required
            name="last_name"
            label={intl.formatMessage(managementMessages.last_nameInputLabel)}
          />
        </Form.Row>
        <Form.Row>
          <Input
            required
            fullWidth
            name="address"
            label={intl.formatMessage(managementMessages.addressInputLabel)}
          />
        </Form.Row>

        <Form.Row>
          <Input
            className="form-field"
            required
            name="postcode"
            label={intl.formatMessage(managementMessages.postcodeInputLabel)}
          />

          <Input
            className="form-field"
            required
            name="city"
            label={intl.formatMessage(managementMessages.cityInputLabel)}
          />
        </Form.Row>
        <Form.Row>
          <CountrySelectField
            name="country"
            label={intl.formatMessage(managementMessages.countryInputLabel)}
          />
        </Form.Row>
        {!(address && address.is_main) && (
          <Checkbox
            aria-invalid={!!formState.errors?.is_main}
            id="is_main"
            label={intl.formatMessage(messages.isMainInputLabel)}
            state={formState.errors?.is_main ? 'error' : 'default'}
            {...getLocalizedCunninghamErrorProp(
              intl,
              formState.errors.is_main?.message,
              intl.formatMessage(formMessages.optionalFieldText),
            )}
            {...register('is_main')}
          />
        )}
      </Form>
    </FormProvider>
  );

  return {
    FormView,
    handleSubmit,
    reset: form.reset,
  };
};

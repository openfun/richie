import { yupResolver } from '@hookform/resolvers/yup';
import { Fragment, useEffect } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { FormattedMessage, useIntl } from 'react-intl';
import { Button, Checkbox } from '@openfun/cunningham-react';
import { getLocalizedCunninghamErrorProp } from 'components/Form/utils';
import { messages } from 'components/AddressesManagement/index';
import { CountrySelectField } from 'components/Form/CountrySelectField';
import Input from 'components/Form/Input';
import { useAddresses } from 'hooks/useAddresses';
import type { Address } from 'types/Joanie';
import { messages as formMessages } from 'components/Form/messages';
import Form from 'components/Form';
import validationSchema from './validationSchema';

export interface AddressFormValues extends Omit<Address, 'id' | 'is_main'> {
  save?: boolean;
}

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

  const form = useForm<AddressFormValues>({
    defaultValues: address || defaultValues,
    mode: 'onBlur',
    reValidateMode: 'onChange',
    resolver: yupResolver(validationSchema),
  });
  const { register, handleSubmit, reset, formState } = form;

  const addresses = useAddresses();
  const intl = useIntl();

  useEffect(() => {
    reset(address);
  }, [address]);

  /**
   * Prevent form to be submitted and clear `editedAddress` state.
   */
  const handleCancel = (event: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
    event.preventDefault();
    handleReset();
    return false;
  };

  return (
    <FormProvider {...form}>
      <Form name="address-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <p className="form__required-fields-note">
          <FormattedMessage {...formMessages.formOptionalFieldsText} />
        </p>
        <Form.Row>
          <Input
            className="form-field"
            required
            fullWidth
            name="title"
            label={intl.formatMessage(messages.titleInputLabel)}
          />
        </Form.Row>
        <Form.Row>
          <Input
            className="form-field"
            required
            name="first_name"
            label={intl.formatMessage(messages.first_nameInputLabel)}
          />
          <Input
            className="form-field"
            required
            name="last_name"
            label={intl.formatMessage(messages.last_nameInputLabel)}
          />
        </Form.Row>
        <Form.Row>
          <Input
            required
            fullWidth
            name="address"
            label={intl.formatMessage(messages.addressInputLabel)}
          />
        </Form.Row>
        <Form.Row>
          <Input
            className="form-field"
            required
            name="postcode"
            label={intl.formatMessage(messages.postcodeInputLabel)}
          />

          <Input
            className="form-field"
            required
            name="city"
            label={intl.formatMessage(messages.cityInputLabel)}
          />
        </Form.Row>
        <Form.Row>
          <CountrySelectField
            name="country"
            label={intl.formatMessage(messages.countryInputLabel)}
            state={formState.errors.country ? 'error' : 'default'}
          />
        </Form.Row>

        {!address ? (
          <Form.Row>
            <Checkbox
              aria-invalid={!!formState.errors?.save}
              id="save"
              label={intl.formatMessage(messages.saveInputLabel)}
              state={formState.errors?.save ? 'error' : 'default'}
              {...getLocalizedCunninghamErrorProp(
                intl,
                formState.errors.save?.message,
                intl.formatMessage(formMessages.optionalFieldText),
              )}
              {...register('save')}
            />
          </Form.Row>
        ) : null}

        <footer className="form__footer">
          {address ? (
            <Fragment>
              <Button
                color="tertiary"
                onClick={handleCancel}
                title={intl.formatMessage(messages.cancelTitleButton)}
              >
                <FormattedMessage {...messages.cancelButton} />
              </Button>
              <Button disabled={addresses.states.updating} type="submit">
                <FormattedMessage {...messages.updateButton} />
              </Button>
            </Fragment>
          ) : (
            <Button disabled={addresses.states.creating || addresses.states.updating} type="submit">
              <FormattedMessage {...messages.selectButton} />
            </Button>
          )}
        </footer>
      </Form>
    </FormProvider>
  );
};

export default AddressForm;

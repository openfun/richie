import { ButtonElement, Input, Alert, VariantType } from '@openfun/cunningham-react';
import { FormattedMessage, defineMessages, useIntl } from 'react-intl';
import { FormProvider, useForm } from 'react-hook-form';
import * as Yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useEffect, useMemo, useRef } from 'react';
import { useSession } from 'contexts/SessionContext';
import useOpenEdxProfile from 'hooks/useOpenEdxProfile';
import Form, { getLocalizedCunninghamErrorProp } from 'components/Form';
import { Spinner } from 'components/Spinner';
import { useSaleTunnelContext } from 'components/SaleTunnel/GenericSaleTunnel';

const messages = defineMessages({
  emailInputLabel: {
    id: 'components.OpenEdxFullNameForm.emailInputLabel',
    description: 'Label of "email" field of the openEdx full name form',
    defaultMessage: 'Email',
  },
  fullNameInputLabel: {
    id: 'components.OpenEdxFullNameForm.fullNameInputLabel',
    description: 'Label of "First name and last name" field of the openEdx full name form',
    defaultMessage: 'First name and last name',
  },
  fullNameInputDescription: {
    id: 'components.OpenEdxFullNameForm.fullNameInputDescription',
    description:
      'Description about the "First name and last name" field of the openEdx full name form.',
    defaultMessage:
      'Please check that your first name and last name are correct. They will be used on official document (e.g: certificate, contract, etc.)',
  },
  submitButtonLabel: {
    id: 'components.OpenEdxFullNameForm.submitButtonLabel',
    description: 'Label of the submit button on openEdx full name form',
    defaultMessage: 'Submit',
  },
  loadingLabel: {
    id: 'components.OpenEdxFullNameForm.loadingLabel',
    description: 'Label of the loading profile spinner on openEdx full name form',
    defaultMessage: 'Loading...',
  },
  error: {
    id: 'components.OpenEdxFullNameForm.error',
    description: 'Message displayed i nopenEdx full name form when submit the request fail',
    defaultMessage: 'There was an error while updating your full name. Please try again later.',
  },
});

export interface OpenEdxFullNameFormValues {
  name: string;
}

const validationSchema = Yup.object().shape({
  name: Yup.string().required().min(3),
});

const OpenEdxFullNameForm = () => {
  const intl = useIntl();
  const { registerSubmitCallback, unregisterSubmitCallback } = useSaleTunnelContext();
  const { user } = useSession();
  const buttonRef = useRef<ButtonElement>(null);
  const {
    data: openEdxProfileData,
    methods: { update, invalidate },
    states: { isFetched, isPending },
    error,
  } = useOpenEdxProfile({
    username: user!.username,
  });

  const defaultValues = useMemo(
    () => ({
      name: (openEdxProfileData?.name || '')?.trim(),
    }),
    [openEdxProfileData],
  );

  const form = useForm<OpenEdxFullNameFormValues>({
    defaultValues,
    mode: 'onBlur',
    reValidateMode: 'onChange',
    resolver: yupResolver(validationSchema),
  });

  const { getValues, register, handleSubmit, reset, formState } = form;

  useEffect(() => {
    if (openEdxProfileData) {
      reset({ name: (openEdxProfileData?.name || '')?.trim() });
    }
  }, [openEdxProfileData]);

  useEffect(() => {
    registerSubmitCallback('openEdxFullNameForm', async () => {
      return new Promise<void>((resolve, reject) => {
        const { name } = getValues();
        // Don't save if the form has not been modified.
        if (name && !formState.isDirty) {
          resolve();
          return;
        }

        handleSubmit(async (values) => {
          // We need to rely on onSuccess and onError callbacks bring up the promise state up to the SaleTunnel context.
          // This is because update() function is not asynchronous, it is a mutator wrapper by react-query.
          update(values, {
            onSuccess: () => {
              buttonRef.current?.blur();
              invalidate();
              resolve();
            },
            onError: (e) => reject(e),
          });
        }, reject)();
      });
    });
    return () => {
      unregisterSubmitCallback('openEdxFullNameForm');
    };
  }, [formState.isDirty, handleSubmit, update]);

  if (!isFetched && isPending) {
    return (
      <Spinner>
        <FormattedMessage {...messages.loadingLabel} />
      </Spinner>
    );
  }

  if (error) {
    // display get error message
    return <Alert type={VariantType.ERROR}>{error}</Alert>;
  }

  return (
    <FormProvider {...form}>
      <Form name="openedx-fullname-form" noValidate>
        <Alert type={formState.errors.name?.message ? VariantType.ERROR : VariantType.WARNING}>
          <FormattedMessage {...messages.fullNameInputDescription} />
        </Alert>
        <Input
          {...register('name')}
          className="form-field mt-s"
          required
          fullWidth
          label={intl.formatMessage(messages.fullNameInputLabel)}
          value={formState.defaultValues?.name}
          state={error || formState.errors.name?.message ? 'error' : 'default'}
          text={error || getLocalizedCunninghamErrorProp(intl, formState.errors.name?.message).text}
        />
      </Form>
    </FormProvider>
  );
};

export default OpenEdxFullNameForm;

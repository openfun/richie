import { Button, ButtonElement, Input } from '@openfun/cunningham-react';
import { FormattedMessage, defineMessages, useIntl } from 'react-intl';
import { FormProvider, useForm } from 'react-hook-form';
import * as Yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSession } from 'contexts/SessionContext';
import useOpenEdxProfile from 'hooks/useOpenEdxProfile';
import Form, { getLocalizedCunninghamErrorProp } from 'components/Form';
import { Spinner } from 'components/Spinner';
import Banner, { BannerType } from 'components/Banner';
import { UserHelper } from 'utils/UserHelper';

const messages = defineMessages({
  emailInputLabel: {
    id: 'components.OpenEdxFullNameForm.emailInputLabel',
    description: 'Label of "email" field of the openEdx full name form',
    defaultMessage: 'Email',
  },
  fullNameInputLabel: {
    id: 'components.OpenEdxFullNameForm.fullNameInputLabel',
    description: 'Label of "fullName" field of the openEdx full name form',
    defaultMessage: 'FullName',
  },
  fullNameInputDescription: {
    id: 'components.OpenEdxFullNameForm.fullNameInputDescription',
    description: 'Descripiton on the "fullName" field of the openEdx full name form.',
    defaultMessage:
      'Please check that your fullname is correct. It will be used on official document (e.g: certificate)',
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
  name: Yup.string().required(),
});

const OpenEdxFullNameForm = () => {
  const intl = useIntl();
  const { user } = useSession();
  const buttonRef = useRef<ButtonElement>(null);
  const [isSubmitButtonDisabled, setIsSubmitButtonDisabled] = useState<boolean>(true);
  const {
    data: openEdxProfileData,
    methods: { update, invalidate },
    states: { isFetched, isPending },
    error,
  } = useOpenEdxProfile({
    username: user!.username,
  });

  const defaultValues = useMemo(
    () =>
      ({
        name: (openEdxProfileData ? UserHelper.getName(openEdxProfileData) : '')?.trim(),
      }) as OpenEdxFullNameFormValues,
    [openEdxProfileData],
  );

  const form = useForm<OpenEdxFullNameFormValues>({
    defaultValues,
    mode: 'onBlur',
    reValidateMode: 'onChange',
    resolver: yupResolver(validationSchema),
  });

  const { register, handleSubmit, reset, formState } = form;

  const onSubmit = async (values: OpenEdxFullNameFormValues) => {
    await update(values);
    buttonRef.current?.blur();
    invalidate();
    setIsSubmitButtonDisabled(true);
  };

  const onChangeFullName = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsSubmitButtonDisabled(e.target.value.trim() === defaultValues.name);
  };

  useEffect(() => {
    if (openEdxProfileData) {
      reset({ name: (openEdxProfileData ? UserHelper.getName(openEdxProfileData) : '')?.trim() });
    }
  }, [openEdxProfileData]);

  if (!isFetched && isPending) {
    return (
      <Spinner>
        <FormattedMessage {...messages.loadingLabel} />
      </Spinner>
    );
  }

  if (error) {
    // display get error message
    return <Banner type={BannerType.ERROR} message={error} />;
  }

  return (
    <FormProvider {...form}>
      <Form name="openedx-fullname-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Form.Row>
          <Form.Row>
            <Input
              {...register('name', {
                onChange: onChangeFullName,
              })}
              className="form-field"
              required
              fullWidth
              label={intl.formatMessage(messages.fullNameInputLabel)}
              value={formState.defaultValues?.name}
              state={
                error || (formState.errors.name && formState.errors.name.message)
                  ? 'error'
                  : 'default'
              }
              rightIcon={
                <Button
                  ref={buttonRef}
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  color="secondary"
                  size="small"
                  disabled={isSubmitButtonDisabled}
                >
                  {isPending ? <Spinner /> : <FormattedMessage {...messages.submitButtonLabel} />}
                </Button>
              }
              text={
                error ||
                getLocalizedCunninghamErrorProp(intl, formState.errors.name?.message).text ||
                intl.formatMessage(messages.fullNameInputDescription)
              }
            />
          </Form.Row>
          {openEdxProfileData?.email && (
            <Form.Row>
              <Input
                label={intl.formatMessage(messages.emailInputLabel)}
                value={openEdxProfileData?.email}
                disabled
              />
            </Form.Row>
          )}
        </Form.Row>
      </Form>
    </FormProvider>
  );
};

export default OpenEdxFullNameForm;

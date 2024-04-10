import { Button, Input } from '@openfun/cunningham-react';
import { FormattedMessage, defineMessages, useIntl } from 'react-intl';
import { FormProvider, useForm } from 'react-hook-form';
import * as Yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useEffect, useState } from 'react';
import { useSession } from 'contexts/SessionContext';
import useOpenEdxProfile from 'hooks/useOpenEdxProfile';
import Form, { getLocalizedCunninghamErrorProp } from 'components/Form';
import { Spinner } from 'components/Spinner';
import Banner, { BannerType } from 'components/Banner';

const messages = defineMessages({
  fullNameInputLabel: {
    id: 'components.OpenEdxFullNameForm.fullNameInputLabel',
    description: 'Label of "fullName" field OpenEdx full name form',
    defaultMessage: 'FullName',
  },
  submitButtonLabel: {
    id: 'components.OpenEdxFullNameForm.submitButtonLabel',
    description: 'Label of the submit button on OpenEdx full name form',
    defaultMessage: 'Submit',
  },
  loadingLabel: {
    id: 'components.OpenEdxFullNameForm.loadingLabel',
    description: 'Label of the loading profile spinner on OpenEdx full name form',
    defaultMessage: 'Loading...',
  },
  error: {
    id: 'components.OpenEdxFullNameForm.error',
    description: 'Message displayed if OpenEdx profile update request fail',
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
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const {
    data: openEdxProfileData,
    methods: { update },
    states: { isFetched, isPending },
    error,
  } = useOpenEdxProfile({
    username: user!.username,
    onUpdateSuccess: () => {
      setIsSuccess(true);
    },
  });

  const defaultValues = {
    name: openEdxProfileData ? openEdxProfileData.name : '',
  } as OpenEdxFullNameFormValues;
  const form = useForm<OpenEdxFullNameFormValues>({
    defaultValues,
    mode: 'onBlur',
    reValidateMode: 'onChange',
    resolver: yupResolver(validationSchema),
  });
  const { register, handleSubmit, reset, formState } = form;

  const onSubmit = (values: OpenEdxFullNameFormValues) => {
    update(values);
  };

  useEffect(() => {
    if (openEdxProfileData) {
      reset({ name: openEdxProfileData.name });
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
          <Input
            {...register('name', {
              onBlur: () => {
                if ('name' in formState.dirtyFields) {
                  setIsSuccess(false);
                }
              },
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
            rightIcon={isSuccess ? <span className="material-icons">check</span> : undefined}
            text={
              error || getLocalizedCunninghamErrorProp(intl, formState.errors.name?.message).text
            }
          />
          <Form.RowButtonContainer>
            <Button>
              <FormattedMessage {...messages.submitButtonLabel} />
            </Button>
          </Form.RowButtonContainer>
        </Form.Row>
      </Form>
    </FormProvider>
  );
};

export default OpenEdxFullNameForm;

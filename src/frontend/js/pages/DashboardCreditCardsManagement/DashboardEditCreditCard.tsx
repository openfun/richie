import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { FormProvider, useForm } from 'react-hook-form';
import { useEffect } from 'react';
import { Button, Checkbox } from '@openfun/cunningham-react';
import { getLocalizedCunninghamErrorProp } from 'components/Form/utils';
import Input from 'components/Form/Input';
import { CreditCard } from 'types/Joanie';
import { DashboardCard } from 'widgets/Dashboard/components/DashboardCard';
import { Spinner } from 'components/Spinner';
import Banner, { BannerType } from 'components/Banner';
import { useCreditCardsManagement } from 'hooks/useCreditCardsManagement';
import { noop } from 'utils';
import Form from 'components/Form';
import { CreditCardBrandLogo } from './CreditCardBrandLogo';

const messages = defineMessages({
  header: {
    id: 'components.DashboardEditCreditCard.header',
    description: 'Title of the dashboard credit card edit form',
    defaultMessage: 'Edit credit card',
  },
  submit: {
    id: 'components.DashboardEditCreditCard.submit',
    description: 'Submit button of the dashboard credit card edit form',
    defaultMessage: 'Save updates',
  },
  delete: {
    id: 'components.DashboardEditCreditCard.delete',
    description: 'Delete button of the dashboard credit card edit form',
    defaultMessage: 'Delete',
  },
  titleInputLabel: {
    id: 'components.DashboardEditCreditCard.titleInputLabel',
    description: 'Label of the title input on the credit card edit page',
    defaultMessage: 'Name of the credit card',
  },
  lastNumbersInputLabel: {
    id: 'components.DashboardEditCreditCard.lastNumbersInputLabel',
    description: 'Label of the last numbers input on the credit card edit page',
    defaultMessage: 'Numbers',
  },
  expirationInputLabel: {
    id: 'components.DashboardEditCreditCard.expirationInputLabel',
    description: 'Label of the expiration input on the credit card edit page',
    defaultMessage: 'Expiration',
  },
  isMainInputLabel: {
    id: 'components.DashboardEditCreditCard.isMainInputLabel',
    description: 'Label of the "is_main" input on the credit card edit page',
    defaultMessage: 'Use this credit card as default',
  },
});

interface Props {
  creditCard: CreditCard;
  onSettled?: Function;
}

interface FormValues {
  title: string;
  last_numbers: string;
  expiration: string;
  is_main: boolean;
}

export const DashboardEditCreditCard = ({ creditCard, onSettled = noop }: Props) => {
  const intl = useIntl();

  const {
    methods: { update, safeDelete },
    states: { isPending, error },
  } = useCreditCardsManagement();

  const defaultValues: FormValues = {
    title: '',
    last_numbers: '',
    expiration: '',
    is_main: true,
  };

  const form = useForm<FormValues>({
    defaultValues,
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });
  const { register, handleSubmit, reset, formState } = form;

  useEffect(() => {
    reset({
      ...creditCard,
      expiration: creditCard.expiration_month + '/' + creditCard.expiration_year,
      last_numbers: '•••• ••••  ••••  ' + creditCard.last_numbers,
    });
  }, [creditCard]);

  const onSubmit = (data: FormValues) => {
    update(
      {
        ...creditCard,
        title: data.title,
        is_main: data.is_main,
      },
      {
        onSuccess: () => {
          onSettled();
        },
      },
    );
  };

  const renderContent = () => {
    if (isPending) {
      return <Spinner />;
    }
    if (error) {
      return <Banner message={error} type={BannerType.ERROR} rounded />;
    }
    return (
      <FormProvider {...form}>
        <Form onSubmit={handleSubmit(onSubmit)} noValidate>
          <Form.Row>
            <Input name="title" label={intl.formatMessage(messages.titleInputLabel)} />
          </Form.Row>
          <Form.Row className="dashboard-edit-credit-card__sensitive">
            <Input
              name="last_numbers"
              disabled={true}
              label={intl.formatMessage(messages.lastNumbersInputLabel)}
            />
            <div className="dashboard-edit-credit-card__sensitive__sub">
              <CreditCardBrandLogo creditCard={creditCard} />
              <Input
                size={8}
                name="expiration"
                disabled={true}
                label={intl.formatMessage(messages.expirationInputLabel)}
              />
            </div>
          </Form.Row>
          {!creditCard.is_main && (
            <Form.Row>
              <Checkbox
                aria-invalid={!!formState.errors?.is_main}
                id="is_main"
                label={intl.formatMessage(messages.isMainInputLabel)}
                state={formState.errors.is_main ? 'error' : 'default'}
                {...getLocalizedCunninghamErrorProp(intl, formState.errors.is_main?.message)}
                {...register('is_main')}
              />
            </Form.Row>
          )}
        </Form>
      </FormProvider>
    );
  };

  return (
    <DashboardCard
      header={<FormattedMessage {...messages.header} />}
      footer={
        <>
          <Button color="secondary" onClick={handleSubmit(onSubmit)}>
            <FormattedMessage {...messages.submit} />
          </Button>
          {!creditCard.is_main && (
            <Button
              color="secondary"
              onClick={() =>
                safeDelete(creditCard, {
                  onSuccess: () => {
                    onSettled();
                  },
                })
              }
            >
              <FormattedMessage {...messages.delete} />
            </Button>
          )}
        </>
      }
    >
      {renderContent()}
    </DashboardCard>
  );
};

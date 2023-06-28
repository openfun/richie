import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { useForm } from 'react-hook-form';
import { useEffect } from 'react';
import { CreditCard } from 'types/Joanie';
import { DashboardCard } from 'widgets/Dashboard/components/DashboardCard';
import { Button } from 'components/Button';
import { Spinner } from 'components/Spinner';
import Banner, { BannerType } from 'components/Banner';
import { CheckboxField, TextField } from 'components/Form';
import { getLocalizedErrorMessage } from 'components/AddressesManagement/AddressForm/validationSchema';
import { useCreditCardsManagement } from 'hooks/useCreditCardsManagement';
import { noop } from 'utils';
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
    states: { isLoading, error },
  } = useCreditCardsManagement();

  const defaultValues: FormValues = {
    title: '',
    last_numbers: '',
    expiration: '',
    is_main: true,
  };

  const { register, handleSubmit, reset, formState } = useForm<FormValues>({
    defaultValues,
    mode: 'onChange',
    reValidateMode: 'onChange',
  });

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
    if (isLoading) {
      return <Spinner />;
    }
    if (error) {
      return <Banner message={error} type={BannerType.ERROR} rounded />;
    }
    return (
      <form>
        <TextField
          aria-invalid={!!formState.errors.title}
          id="title"
          label={intl.formatMessage(messages.titleInputLabel)}
          error={!!formState.errors.title}
          message={getLocalizedErrorMessage(intl, formState.errors.title?.message)}
          {...register('title')}
        />
        <div className="dashboard-edit-credit-card__sensitive">
          <TextField
            id="last_numbers"
            disabled={true}
            label={intl.formatMessage(messages.lastNumbersInputLabel)}
            {...register('last_numbers')}
          />
          <div className="dashboard-edit-credit-card__sensitive__sub">
            <CreditCardBrandLogo creditCard={creditCard} />
            <TextField
              size={8}
              id="expiration"
              disabled={true}
              label={intl.formatMessage(messages.expirationInputLabel)}
              {...register('expiration')}
            />
          </div>
        </div>
        {!creditCard.is_main && (
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
  };

  return (
    <DashboardCard
      header={<FormattedMessage {...messages.header} />}
      footer={
        <>
          <Button color="outline-primary" onClick={handleSubmit(onSubmit)}>
            <FormattedMessage {...messages.submit} />
          </Button>
          {!creditCard.is_main && (
            <Button
              color="outline-primary"
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

import { defineMessages, FormattedMessage } from 'react-intl';
import { Button } from '@openfun/cunningham-react';
import Banner, { BannerType } from 'components/Banner';
import { DashboardCard } from 'widgets/Dashboard/components/DashboardCard';
import { Spinner } from 'components/Spinner';
import { useAddressesManagement } from 'hooks/useAddressesManagement';
import { AddressFormValues, useDashboardAddressForm } from 'hooks/useDashboardAddressForm';

const messages = defineMessages({
  header: {
    id: 'components.DashboardCreateAddressForm.header',
    description: 'Title of the dashboard address creation form',
    defaultMessage: 'Create an address',
  },
  submit: {
    id: 'components.DashboardCreateAddressForm.submit',
    description: 'Submit button of the dashboard address creation form',
    defaultMessage: 'Create',
  },
});

export const DashboardCreateAddress = ({ onSettled }: { onSettled?: Function }) => {
  const { FormView, handleSubmit } = useDashboardAddressForm();
  const {
    methods: { create },
    states: { error, isPending },
  } = useAddressesManagement();

  const onSubmit = (data: AddressFormValues) => {
    create(data, {
      onSuccess: () => {
        onSettled?.();
      },
    });
  };

  return (
    <DashboardCard
      header={<FormattedMessage {...messages.header} />}
      footer={
        <Button color="primary" onClick={handleSubmit(onSubmit)}>
          <FormattedMessage {...messages.submit} />
        </Button>
      }
    >
      {isPending && <Spinner />}
      {!isPending && (
        <div>
          {error && <Banner message={error} type={BannerType.ERROR} rounded />}
          {FormView}
        </div>
      )}
    </DashboardCard>
  );
};

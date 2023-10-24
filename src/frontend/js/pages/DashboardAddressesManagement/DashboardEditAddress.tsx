import { defineMessages, FormattedMessage } from 'react-intl';
import { Button } from '@openfun/cunningham-react';
import Banner, { BannerType } from 'components/Banner';
import { DashboardCard } from 'widgets/Dashboard/components/DashboardCard';
import { Spinner } from 'components/Spinner';
import { useAddressesManagement } from 'hooks/useAddressesManagement';
import { AddressFormValues, useDashboardAddressForm } from 'hooks/useDashboardAddressForm';
import { Address } from 'types/Joanie';
import { noop } from 'utils';

const messages = defineMessages({
  header: {
    id: 'components.DashboardEditAddressForm.header',
    description: 'Title of the dashboard address edit form',
    defaultMessage: 'Edit address "{title}"',
  },
  submit: {
    id: 'components.DashboardEditAddressForm.submit',
    description: 'Submit button of the dashboard address edit form',
    defaultMessage: 'Save updates',
  },
  remove: {
    id: 'components.DashboardEditAddressForm.remove',
    description: 'Remove button of the dashboard address edit form',
    defaultMessage: 'Remove',
  },
});

interface DashboardEditAddressProps {
  address: Address;
  onSettled?: Function;
}

export const DashboardEditAddress = ({ address, onSettled = noop }: DashboardEditAddressProps) => {
  const { FormView, handleSubmit } = useDashboardAddressForm(address);
  const {
    methods: { update, remove },
    states: { error, isPending },
  } = useAddressesManagement();

  const onSubmit = (data: AddressFormValues) => {
    update(
      { ...address, ...data },
      {
        onSuccess: () => {
          onSettled?.();
        },
      },
    );
  };

  return (
    <DashboardCard
      header={<FormattedMessage {...messages.header} values={{ title: address.title }} />}
      footer={
        <>
          <Button color="secondary" onClick={handleSubmit(onSubmit)}>
            <FormattedMessage {...messages.submit} />
          </Button>
          {!address.is_main && (
            <Button
              color="secondary"
              onClick={() => {
                remove(address, {
                  onSuccess: () => onSettled(),
                });
              }}
            >
              <FormattedMessage {...messages.remove} />
            </Button>
          )}
        </>
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

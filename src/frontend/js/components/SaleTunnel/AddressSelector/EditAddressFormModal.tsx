import { Button, Modal, ModalSize } from '@openfun/cunningham-react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { AddressFormModalProps } from 'components/SaleTunnel/AddressSelector/CreateAddressFormModal';
import { Address } from 'types/Joanie';
import { AddressFormValues, useDashboardAddressForm } from 'hooks/useDashboardAddressForm';
import { useAddressesManagement } from 'hooks/useAddressesManagement';
import { Spinner } from 'components/Spinner';
import Banner, { BannerType } from 'components/Banner';

const messages = defineMessages({
  title: {
    defaultMessage: 'Edit address',
    description: 'Edit address modal title.',
    id: 'components.SaleTunnel.AddressSelector.EditAddressFormModal.title',
  },
  save: {
    defaultMessage: 'Save',
    description: 'Save button label.',
    id: 'components.SaleTunnel.AddressSelector.EditAddressFormModal.save',
  },
});

export const EditAddressFormModal = ({
  address,
  onSettled,
  ...props
}: AddressFormModalProps & { address: Address }) => {
  const intl = useIntl();
  const { FormView, handleSubmit, reset } = useDashboardAddressForm(address);
  const {
    methods: { update },
    states: { error, isPending },
  } = useAddressesManagement();

  const onSubmit = (data: AddressFormValues) => {
    update(
      { ...address, ...data },
      {
        onSuccess: (newAddress) => {
          onSettled?.(newAddress);
          reset();
        },
      },
    );
  };

  return (
    <Modal
      {...props}
      size={ModalSize.MEDIUM}
      title={intl.formatMessage(messages.title)}
      actions={
        <Button color="primary" size="small" onClick={handleSubmit(onSubmit)}>
          <FormattedMessage {...messages.save} />
        </Button>
      }
    >
      <div className="address-select__form">
        {isPending && <Spinner />}
        {!isPending && (
          <div>
            {error && <Banner message={error} type={BannerType.ERROR} rounded />}
            {FormView}
          </div>
        )}
      </div>
    </Modal>
  );
};

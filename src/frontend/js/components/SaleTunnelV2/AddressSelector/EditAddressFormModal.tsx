import { Button, Modal, ModalSize } from '@openfun/cunningham-react';
import { AddressFormModalProps } from 'components/SaleTunnelV2/AddressSelector/CreateAddressFormModal';
import { Address } from 'types/Joanie';
import { AddressFormValues, useDashboardAddressForm } from 'hooks/useDashboardAddressForm';
import { useAddressesManagement } from 'hooks/useAddressesManagement';
import { Spinner } from 'components/Spinner';
import Banner, { BannerType } from 'components/Banner';

export const EditAddressFormModal = ({
  address,
  onSettled,
  ...props
}: AddressFormModalProps & { address: Address }) => {
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
      title="Edit address"
      actions={
        <Button color="primary" size="small" onClick={handleSubmit(onSubmit)}>
          Save
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

import { Button, Select, useModal } from '@openfun/cunningham-react';
import { useEffect, useMemo, useState } from 'react';
import { useAddresses } from 'hooks/useAddresses';
import { Address } from 'types/Joanie';
import { CreateAddressFormModal } from 'components/SaleTunnelV2/AddressSelector/CreateAddressFormModal';
import { EditAddressFormModal } from 'components/SaleTunnelV2/AddressSelector/EditAddressFormModal';
import { useSaleTunnelV2Context } from 'components/SaleTunnelV2/GenericSaleTunnel';

export const AddressSelector = () => {
  const addresses = useAddresses();

  const { billingAddress, setBillingAddress } = useSaleTunnelV2Context();

  const options = useMemo(
    () =>
      addresses.items.map((address) => ({
        value: address.id,
        label: getAddressLabel(address),
      })),
    [addresses.items],
  );

  // Set main address as default billing address
  useEffect(() => {
    if (!billingAddress) {
      console.log(
        'set default',
        addresses.items.find((address) => address.is_main),
      );
      setBillingAddress(addresses.items.find((address) => address.is_main));
    }
  }, [addresses.items]);

  console.log('billingAddress', billingAddress, addresses.items);

  const createFormModal = useModal();
  const editFormModal = useModal();

  return (
    <div className="mt-s sale-tunnel__information__billing-address">
      <Select
        label="Billing address"
        options={options}
        fullWidth
        value={billingAddress?.id}
        onChange={(e) => {
          setBillingAddress(addresses.items.find((address) => address.id === e.target.value));
        }}
      />
      {billingAddress ? (
        <Button
          size="small"
          icon={<span className="material-icons">edit</span>}
          color="tertiary"
          onClick={editFormModal.open}
        >
          Edit
        </Button>
      ) : (
        <Button
          size="small"
          icon={<span className="material-icons">add</span>}
          color="primary"
          onClick={createFormModal.open}
        >
          Create
        </Button>
      )}
      <CreateAddressFormModal
        {...createFormModal}
        onSettled={(newAddress) => {
          setBillingAddress(newAddress);
          createFormModal.close();
        }}
      />
      <EditAddressFormModal
        {...editFormModal}
        address={billingAddress!}
        onSettled={(updatedAddress) => {
          editFormModal.close();
          setBillingAddress(updatedAddress);
        }}
      />
    </div>
  );
};

function getAddressLabel(address: Address) {
  const part = [
    address.first_name,
    address.last_name,
    address.address,
    address.postcode,
    address.city,
    address.country,
  ].join(' ');
  if (address.title) {
    return `${address.title} - ${part}`;
  }
  return part;
}

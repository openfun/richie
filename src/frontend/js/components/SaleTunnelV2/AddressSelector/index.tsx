import { Button, Select, useModal } from '@openfun/cunningham-react';
import { useEffect, useMemo, useState } from 'react';
import { useAddresses } from 'hooks/useAddresses';
import { Address } from 'types/Joanie';
import { CreateAddressFormModal } from 'components/SaleTunnelV2/AddressSelector/CreateAddressFormModal';
import { EditAddressFormModal } from 'components/SaleTunnelV2/AddressSelector/EditAddressFormModal';

export const AddressSelector = () => {
  const addresses = useAddresses();

  const [selectedAddress, setSelectedAddress] = useState<Address>();
  const options = useMemo(
    () =>
      addresses.items.map((address) => ({
        value: address.id,
        label: getAddressLabel(address),
      })),
    [addresses.items],
  );

  useEffect(() => {
    if (!selectedAddress) {
      setSelectedAddress(addresses.items.find((address) => address.is_main));
    }
  }, [addresses.items]);

  const createFormModal = useModal();
  const editFormModal = useModal();

  return (
    <div className="mt-s sale-tunnel__information__billing-address">
      <Select
        label="Billing address"
        options={options}
        fullWidth
        value={selectedAddress?.id}
        onChange={(e) => {
          setSelectedAddress(addresses.items.find((address) => address.id === e.target.value));
        }}
      />
      {selectedAddress ? (
        <Button
          size="small"
          icon={<span className="material-icons">add</span>}
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
          setSelectedAddress(newAddress);
          createFormModal.close();
        }}
      />
      <EditAddressFormModal
        {...editFormModal}
        address={selectedAddress!}
        onSettled={(updatedAddress) => {
          editFormModal.close();
          setSelectedAddress(updatedAddress);
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

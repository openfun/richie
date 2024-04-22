import { Button, Select, useModal } from '@openfun/cunningham-react';
import { useEffect, useMemo } from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { useAddresses } from 'hooks/useAddresses';
import { Address } from 'types/Joanie';
import { CreateAddressFormModal } from 'components/SaleTunnel/AddressSelector/CreateAddressFormModal';
import { EditAddressFormModal } from 'components/SaleTunnel/AddressSelector/EditAddressFormModal';
import { useSaleTunnelContext } from 'components/SaleTunnel/GenericSaleTunnel';
import { useMatchMediaLg } from 'hooks/useMatchMedia';

const messages = defineMessages({
  label: {
    defaultMessage: 'Billing address',
    description: 'Address field label.',
    id: 'components.SaleTunnel.AddressSelector.label',
  },
  edit: {
    defaultMessage: 'Edit',
    description: 'Address edit button.',
    id: 'components.SaleTunnel.AddressSelector.edit',
  },
  create: {
    defaultMessage: 'Create',
    description: 'Address create button.',
    id: 'components.SaleTunnel.AddressSelector.create',
  },
});

export const AddressSelector = () => {
  const intl = useIntl();
  const addresses = useAddresses();
  const { billingAddress, setBillingAddress } = useSaleTunnelContext();

  const options = useMemo(
    () =>
      addresses.items.map((address) => ({
        value: address.id,
        label: getAddressLabel(address),
        render: () => (
          <address className="address-selector__option">
            {address.title && (
              <strong className="address-selector__option__title">{address.title}</strong>
            )}
            <br />
            <small>{getAddressString(address)}</small>
          </address>
        ),
      })),
    [addresses.items],
  );

  // Set main address as default billing address
  useEffect(() => {
    if (!billingAddress) {
      setBillingAddress(addresses.items.find((address) => address.is_main));
    }
  }, [addresses.items]);

  const createFormModal = useModal();
  const editFormModal = useModal();
  const isMobile = useMatchMediaLg();

  return (
    <div className="mt-s sale-tunnel__information__billing-address">
      <Select
        label={intl.formatMessage(messages.label)}
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
          fullWidth={isMobile}
        >
          <FormattedMessage {...messages.edit} />
        </Button>
      ) : (
        <Button
          size="small"
          icon={<span className="material-icons">add</span>}
          color="primary"
          onClick={createFormModal.open}
          fullWidth={isMobile}
        >
          <FormattedMessage {...messages.create} />
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
          setBillingAddress(updatedAddress);
          editFormModal.close();
        }}
      />
    </div>
  );
};

export function getAddressLabel(address: Address) {
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
export function getAddressString(address: Address) {
  return [
    address.first_name,
    address.last_name,
    address.address,
    address.postcode,
    address.city,
    address.country,
  ].join(' ');
}

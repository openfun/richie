import { Address } from 'types/Joanie';

export const AddressView = ({ address }: { address: Address }) => {
  return (
    <address>
      {address.first_name}&nbsp;{address.last_name}
      <br />
      {address.address}
      <br />
      {address.postcode} {address.city}, {address.country}
    </address>
  );
};

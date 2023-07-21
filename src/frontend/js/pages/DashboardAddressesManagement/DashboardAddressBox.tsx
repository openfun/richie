import { defineMessages, FormattedMessage } from 'react-intl';
import { Button } from '@openfun/cunningham-react';
import { DashboardBox } from 'widgets/Dashboard/components/DashboardBox';
import { Address } from 'types/Joanie';

const messages = defineMessages({
  isMain: {
    id: 'components.DashboardAddressBox.isMain',
    description: 'Text to inform that the address is the default one on the dashboard',
    defaultMessage: 'Default address',
  },
  delete: {
    id: 'components.DashboardAddressBox.delete',
    description: 'Delete address button on the dashboard addresses list',
    defaultMessage: 'Delete',
  },
  edit: {
    id: 'components.DashboardAddressBox.edit',
    description: 'Edit address button on the dashboard addresses list',
    defaultMessage: 'Edit',
  },
  setMain: {
    id: 'components.DashboardAddressBox.setMain',
    description: 'Set as default button text on the dashboard addresses list',
    defaultMessage: 'Use by default',
  },
});

interface DashboardAddressBoxProps {
  address: Address;
  edit: (address: Address) => void;
  promote: (address: Address) => void;
  remove: (address: Address) => void;
}

export const DashboardAddressBox = ({
  address,
  promote,
  remove,
  edit,
}: DashboardAddressBoxProps) => {
  return (
    <DashboardBox
      data-testid={'dashboard-address-box__' + address.id}
      header={address.is_main ? <FormattedMessage {...messages.isMain} /> : null}
      footer={
        <>
          <div className="dashboard-address-box__buttons">
            {!address.is_main && (
              <Button color="primary" onClick={() => promote(address)}>
                <FormattedMessage {...messages.setMain} />
              </Button>
            )}
            <Button color="primary" onClick={() => edit(address)}>
              <FormattedMessage {...messages.edit} />
            </Button>
          </div>
          {!address.is_main && (
            <Button color="primary" onClick={() => remove(address)}>
              <FormattedMessage {...messages.delete} />
            </Button>
          )}
        </>
      }
    >
      <div>
        <h6 className="dashboard-address-box__title">{address.title}</h6>
        <p className="dashboard-address-box__identity">
          {address.first_name + ' ' + address.last_name}
        </p>
        <p className="dashboard-address-box__address">
          {address.address} - {address.postcode} ({address.country})
        </p>
      </div>
    </DashboardBox>
  );
};

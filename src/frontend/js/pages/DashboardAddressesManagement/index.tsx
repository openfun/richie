import { useMemo } from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { Button } from '@openfun/cunningham-react';
import Banner, { BannerType } from 'components/Banner';
import { DashboardCard } from 'widgets/Dashboard/components/DashboardCard';
import { Icon, IconTypeEnum } from 'components/Icon';
import { Spinner } from 'components/Spinner';
import { useAddressesManagement } from 'hooks/useAddressesManagement';
import { Address } from 'types/Joanie';
import { DashboardBox } from 'widgets/Dashboard/components/DashboardBox';
import { DashboardAddressBox } from './DashboardAddressBox';

const messages = defineMessages({
  header: {
    id: 'components.DashboardAddressesManagement.header',
    description: 'Title of the dashboard addresses management block',
    defaultMessage: 'Billing addresses',
  },
  add: {
    id: 'components.DashboardAddressesManagement.add',
    description: 'Add button of the dashboard addresses management block',
    defaultMessage: 'Add a new address',
  },
  error: {
    id: 'components.DashboardAddressesManagement.error',
    description: 'Error shown in the dashboard addresses management block',
    defaultMessage: 'An error occurred. Please retry later.',
  },
  emptyList: {
    id: 'components.DashboardAddressesManagement.emptyList',
    description: 'Empty placeholder of the dashboard addresses management block',
    defaultMessage: "You haven't created any addresses yet.",
  },
});

interface DashboardAddressesManagementProps {
  onClickCreate?: Function;
  onClickEdit?: (address: Address) => void;
}

export const DashboardAddressesManagement = ({
  onClickCreate,
  onClickEdit,
}: DashboardAddressesManagementProps) => {
  const intl = useIntl();
  const {
    methods: { promote, remove },
    states: { error, isPending },
    ...addresses
  } = useAddressesManagement();

  const addressesList = useMemo(() => {
    return addresses.items.sort((a: Address, b: Address) => {
      if (a.is_main) {
        return -1;
      }
      if (b.is_main) {
        return 1;
      }
      return a.title.localeCompare(b.title, [intl.locale, intl.defaultLocale]);
    });
  }, [addresses.items]);

  return (
    <DashboardCard header={<FormattedMessage {...messages.header} />}>
      <div className="dashboard-addresses">
        {isPending && <Spinner />}
        {!isPending && (
          <>
            {error && <Banner message={error} type={BannerType.ERROR} rounded />}
            {!error && addressesList.length === 0 && (
              <p className="dashboard-addresses__empty">
                <FormattedMessage {...messages.emptyList} />
              </p>
            )}
            {addressesList.length > 0 && (
              <DashboardBox.List>
                {addressesList.map((address) => (
                  <DashboardAddressBox
                    key={address.id}
                    address={address}
                    edit={(_address) => onClickEdit?.(_address)}
                    remove={remove}
                    promote={promote}
                  />
                ))}
              </DashboardBox.List>
            )}
            <Button color="secondary" fullWidth onClick={() => onClickCreate?.()}>
              <Icon name={IconTypeEnum.PLUS} className="button__icon" />
              <FormattedMessage {...messages.add} />
            </Button>
          </>
        )}
      </div>
    </DashboardCard>
  );
};

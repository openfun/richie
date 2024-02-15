import { defineMessages, useIntl } from 'react-intl';
import { Select, SelectProps } from '@openfun/cunningham-react';
import { useEffect, useMemo } from 'react';
import { useOrganizations } from 'hooks/useOrganizations';
import { Spinner } from 'components/Spinner';
import { Organization } from 'types/Joanie';

export const messages = defineMessages({
  organizationFilterLabel: {
    defaultMessage: 'Organization',
    description: 'Use as organization filter label',
    id: 'components.ListFilterOrganization.organizationFilterLabel',
  },
  allOrganizationOption: {
    defaultMessage: 'All organizations',
    description: 'Use as organization filter option label for "all organizations"',
    id: 'components.ListFilterOrganization.allOrganizationOption',
  },
});

interface FilterOrganizationProps {
  defaultValue?: string;
  organizationList?: Organization[];
  onChange: ({ organization_id }: { organization_id?: string }) => void;
  clearable?: boolean;
}

const FilterOrganization = ({
  defaultValue,
  organizationList,
  onChange,
  clearable = false,
}: FilterOrganizationProps) => {
  const intl = useIntl();
  const {
    items: fetchedOrganizationList,
    states: { isFetched },
  } = useOrganizations(undefined, { enabled: !organizationList });
  const isReady = useMemo(() => {
    return organizationList || isFetched;
  }, [organizationList, isFetched]);
  const organizations = organizationList || fetchedOrganizationList;
  const organizationOptions = organizations.map((organization) => ({
    label: organization.title,
    value: organization.id,
  }));

  const handleChange: SelectProps['onChange'] = (e) => {
    const value = e.target.value as string;
    onChange({ organization_id: value });
  };

  useEffect(() => {
    if (!clearable && isReady && defaultValue === undefined) {
      onChange({ organization_id: organizationOptions[0]?.value });
    }
  }, [defaultValue, isFetched]);

  if (!isReady) {
    return <Spinner />;
  }

  return (
    <Select
      label={intl.formatMessage(messages.organizationFilterLabel)}
      options={organizationOptions}
      defaultValue={defaultValue}
      onChange={handleChange}
      clearable={clearable}
      searchable={true}
    />
  );
};

export default FilterOrganization;

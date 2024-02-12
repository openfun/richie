import { defineMessages, useIntl } from 'react-intl';
import { Select, SelectProps } from '@openfun/cunningham-react';
import { useEffect } from 'react';
import { useOrganizations } from 'hooks/useOrganizations';
import { Spinner } from 'components/Spinner';

export const messages = defineMessages({
  organizationFilterLabel: {
    defaultMessage: 'Organization',
    description: 'Use as organization filter label',
    id: 'components.ListFilterOrganization.organizationFilterLabel',
  },
});

interface FilterOrganizationProps {
  defaultValue?: string;
  onChange: ({ organization_id }: { organization_id?: string }) => void;
}

const FilterOrganization = ({ defaultValue, onChange }: FilterOrganizationProps) => {
  const intl = useIntl();
  const {
    items: organizations,
    states: { isFetched },
  } = useOrganizations();

  const organizationOptions = organizations.map((organization) => ({
    label: organization.title,
    value: organization.id,
  }));

  const handleChange: SelectProps['onChange'] = (e) => {
    const value = e.target.value as string;
    onChange({ organization_id: value });
  };

  useEffect(() => {
    if (isFetched && defaultValue === undefined) {
      onChange({ organization_id: organizationOptions[0]?.value });
    }
  }, [defaultValue, isFetched]);

  if (!isFetched) return <Spinner />;

  return (
    <Select
      label={intl.formatMessage(messages.organizationFilterLabel)}
      options={organizationOptions}
      defaultValue={defaultValue || organizationOptions[0].value}
      onChange={handleChange}
      disabled={!isFetched}
      clearable={false}
      searchable={true}
    />
  );
};

export default FilterOrganization;

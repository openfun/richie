import { Select } from '@openfun/cunningham-react';
import { defineMessages, useIntl } from 'react-intl';
import { useOrganizations } from 'hooks/useOrganizations';

const messages = defineMessages({
  organizationFilterLabel: {
    defaultMessage: 'Organization',
    description: 'Use as organization filter label',
    id: 'pages.TeacherDashboardContractsLoader.ContractFilters.organizationFilterLabel',
  },
});

export interface ContractListFilters {
  organizationId?: string;
}

interface ContractFiltersProps {
  onFiltersChange: (filters: ContractListFilters) => void;
}

const ContractFilters = ({ onFiltersChange }: ContractFiltersProps) => {
  const intl = useIntl();
  const {
    items: organizations,
    states: { isFetched },
  } = useOrganizations();
  const organizationOptions = organizations.map((organization) => ({
    label: organization.title,
    value: organization.id,
  }));

  if (!isFetched || organizations.length < 2) {
    return null;
  }

  return (
    <Select
      label={intl.formatMessage(messages.organizationFilterLabel)}
      options={organizationOptions}
      onChange={(e) => onFiltersChange({ organizationId: (e.target.value as string) ?? undefined })}
    />
  );
};

export default ContractFilters;

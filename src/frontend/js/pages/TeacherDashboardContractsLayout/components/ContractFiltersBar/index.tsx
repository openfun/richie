import { Select, SelectProps } from '@openfun/cunningham-react';
import { defineMessages, useIntl } from 'react-intl';
import { useEffect } from 'react';
import { useOrganizations } from 'hooks/useOrganizations';
import { ContractState } from 'types/Joanie';
import { ContractHelper, ContractStatePoV } from 'utils/ContractHelper';
import { Spinner } from 'components/Spinner';

export const messages = defineMessages({
  organizationFilterLabel: {
    defaultMessage: 'Organization',
    description: 'Use as organization filter label',
    id: 'pages.TeacherDashboardContractsLayout.ContractFilters.organizationFilterLabel',
  },
  contractSignatureStateLabel: {
    defaultMessage: 'Signature state',
    description: 'Contract signature state filter label',
    id: 'pages.TeacherDashboardContractsLayout.ContractFilters.contractSignatureStateFilterLabel',
  },
});

export interface ContractListFilters {
  organization_id?: string;
  signature_state?: ContractState;
}

interface ContractFiltersBarProps {
  onFiltersChange: (filters: Partial<ContractListFilters>) => void;
  defaultValues?: ContractListFilters;
  hideFilterOrganization?: boolean;
  hideFilterSignatureState?: boolean;
}

interface FilterProps {
  defaultValue?: SelectProps['defaultValue'];
  onChange: (value: Partial<ContractListFilters>) => void;
}

const ContractFiltersBar = ({
  defaultValues,
  onFiltersChange,
  hideFilterOrganization = false,
  hideFilterSignatureState = false,
}: ContractFiltersBarProps) => {
  return (
    <div className="dashboard__page__actions-row dashboard__page__actions-row--end">
      {!hideFilterOrganization && (
        <OrganizationContractFilter
          defaultValue={defaultValues?.organization_id}
          onChange={onFiltersChange}
        />
      )}
      {!hideFilterSignatureState && (
        <SignatureStateFilter
          defaultValue={defaultValues?.signature_state}
          onChange={onFiltersChange}
        />
      )}
    </div>
  );
};

const OrganizationContractFilter = ({ defaultValue, onChange }: FilterProps) => {
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

const SignatureStateFilter = ({ defaultValue, onChange }: FilterProps) => {
  const intl = useIntl();
  const contractStateOptions = Object.values(ContractState)
    .filter((value) => value !== ContractState.UNSIGNED)
    .map((value) => ({
      label: ContractHelper.getStateLabel(value, ContractStatePoV.ORGANIZATION, intl),
      value,
    }));

  const handleChange: SelectProps['onChange'] = (e) => {
    const value = e.target.value as ContractState;
    onChange({ signature_state: value });
  };

  return (
    <Select
      label={intl.formatMessage(messages.contractSignatureStateLabel)}
      options={contractStateOptions}
      defaultValue={defaultValue}
      onChange={handleChange}
    />
  );
};

export default ContractFiltersBar;

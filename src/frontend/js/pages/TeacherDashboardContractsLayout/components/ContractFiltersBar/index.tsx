import { Select, SelectProps } from '@openfun/cunningham-react';
import { defineMessages, useIntl } from 'react-intl';
import FiltersBar from 'widgets/Dashboard/components/FiltersBar';
import { ContractState, Organization } from 'types/Joanie';
import { ContractHelper, ContractStatePoV } from 'utils/ContractHelper';
import FilterOrganization from 'widgets/Dashboard/components/FilterOrganization';

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
  organizationList?: Organization[];
}

const ContractFiltersBar = ({
  defaultValues,
  onFiltersChange,
  organizationList,
  hideFilterOrganization = false,
  hideFilterSignatureState = false,
}: ContractFiltersBarProps) => {
  return (
    <FiltersBar>
      {!hideFilterOrganization && (
        <FilterOrganization
          defaultValue={defaultValues?.organization_id}
          onChange={onFiltersChange}
          organizationList={organizationList}
        />
      )}
      {!hideFilterSignatureState && (
        <SignatureStateFilter
          defaultValue={defaultValues?.signature_state}
          onChange={onFiltersChange}
        />
      )}
    </FiltersBar>
  );
};

interface ContractFilterProps {
  defaultValue?: SelectProps['defaultValue'];
  onChange: (value: Partial<ContractListFilters>) => void;
}

const SignatureStateFilter = ({ defaultValue, onChange }: ContractFilterProps) => {
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

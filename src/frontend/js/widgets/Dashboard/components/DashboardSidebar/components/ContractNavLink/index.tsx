import { createSearchParams } from 'react-router';
import { useMemo } from 'react';
import { MenuLink } from 'widgets/Dashboard/components/DashboardSidebar';
import { ContractState, Offering, Organization } from 'types/Joanie';
import useTeacherPendingContractsCount from 'hooks/useTeacherPendingContractsCount';
import { ContractActions } from 'utils/AbilitiesHelper/types';
import useContractAbilities from 'hooks/useContractAbilities';
import useDefaultOrganizationId from 'hooks/useDefaultOrganizationId';
import MenuNavLink from '../MenuNavLink';

interface ContractNavLinkProps {
  link: MenuLink;
  organizationId?: Organization['id'];
  offeringId?: Offering['id'];
}

const ContractNavLink = ({ link, organizationId, offeringId }: ContractNavLinkProps) => {
  const defaultOrganizationId = useDefaultOrganizationId();
  const { contracts: pendingContracts, pendingContractCount } = useTeacherPendingContractsCount({
    organizationId: organizationId || defaultOrganizationId,
    offeringId,
  });
  const contractAbilities = useContractAbilities(pendingContracts);
  const canSignContracts = contractAbilities.can(ContractActions.SIGN);
  const hasContractsToSign = useMemo(
    () => canSignContracts && pendingContractCount > 0,
    [canSignContracts, pendingContractCount],
  );
  const searchParams = useMemo(() => {
    if (hasContractsToSign) {
      return createSearchParams({ signature_state: ContractState.LEARNER_SIGNED });
    }

    return createSearchParams({ signature_state: ContractState.SIGNED });
  }, [hasContractsToSign]);

  return (
    <MenuNavLink
      link={{ ...link, to: `${link.to}?${searchParams.toString()}` }}
      badgeCount={hasContractsToSign ? pendingContractCount : undefined}
    />
  );
};

export default ContractNavLink;

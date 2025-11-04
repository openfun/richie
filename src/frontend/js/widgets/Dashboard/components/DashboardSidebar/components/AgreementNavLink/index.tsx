import { createSearchParams } from 'react-router';
import { useMemo } from 'react';
import { MenuLink } from 'widgets/Dashboard/components/DashboardSidebar';
import { ContractState, Offering, Organization } from 'types/Joanie';
import { AgreementActions } from 'utils/AbilitiesHelper/types';
import useDefaultOrganizationId from 'hooks/useDefaultOrganizationId';
import useAgreementAbilities from 'pages/TeacherDashboardOrganizationAgreements/hooks/useAgreementsAbilities';
import useTeacherPendingAgreementsCount from 'hooks/useTeacherPendingAgreementsCount';
import MenuNavLink from '../MenuNavLink';

interface AgreementNavLinkProps {
  link: MenuLink;
  organizationId?: Organization['id'];
  offeringId?: Offering['id'];
}

const AgreementNavLink = ({ link, organizationId, offeringId }: AgreementNavLinkProps) => {
  const defaultOrganizationId = useDefaultOrganizationId();
  const { agreements: pendingAgreements, pendingAgreementCount } = useTeacherPendingAgreementsCount(
    {
      organizationId: organizationId || defaultOrganizationId,
      offeringId,
    },
  );
  const agreementAbilities = useAgreementAbilities(pendingAgreements);
  const canSignAgreements = agreementAbilities.can(AgreementActions.SIGN);
  const hasAgreementsToSign = useMemo(
    () => canSignAgreements && pendingAgreementCount > 0,
    [canSignAgreements, pendingAgreementCount],
  );
  const searchParams = useMemo(() => {
    if (hasAgreementsToSign) {
      return createSearchParams({ signature_state: ContractState.LEARNER_SIGNED });
    }

    return createSearchParams({ signature_state: ContractState.SIGNED });
  }, [hasAgreementsToSign]);

  return (
    <MenuNavLink
      link={{ ...link, to: `${link.to}?${searchParams.toString()}` }}
      badgeCount={hasAgreementsToSign ? pendingAgreementCount : undefined}
    />
  );
};

export default AgreementNavLink;
